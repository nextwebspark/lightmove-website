/**
 * The contact form's fields, reasons and rules. Shared by the /contact page (client-side checks) and
 * the Cloud Function that sends the email (functions/src), so both apply the same limits. Keep this
 * module free of Astro-only imports such as `import.meta.env`: the function bundles it for Node.
 */

export const CONTACT_REASONS = [
  { id: 'build', label: 'Build me a voice agent' },
  { id: 'demo', label: 'Book a demo or a call' },
  { id: 'pricing', label: 'Pricing and billing' },
  { id: 'partnership', label: 'VoIP or reseller partnership' },
  { id: 'support', label: 'Help with my account' },
  { id: 'privacy', label: 'Privacy or data request' },
  { id: 'other', label: 'Other' },
] as const;

export type ContactReasonId = (typeof CONTACT_REASONS)[number]['id'];

export const CONTACT_LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  reasonOther: 120,
  messageMin: 10,
  message: 5000,
} as const;

export interface ContactInput {
  reason: ContactReasonId;
  /** Required when the reason is "other". */
  reasonOther: string;
  name: string;
  email: string;
  company: string;
  message: string;
}

export type ContactField = keyof ContactInput;

export type ContactValidation =
  { ok: true; value: ContactInput } | { ok: false; errors: Partial<Record<ContactField, string>> };

/** The hidden field bots fill in. A real visitor never sees it, so any value means spam. */
export const HONEYPOT_FIELD = 'website';

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

/** Trims and collapses line breaks in single-line fields, so a name can't spill into the subject. */
const oneLine = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/[\r\n\t]+/g, ' ').trim() : '';

const multiLine = (value: unknown): string =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

export function isContactReason(value: unknown): value is ContactReasonId {
  return CONTACT_REASONS.some((reason) => reason.id === value);
}

export function reasonLabel(id: ContactReasonId): string {
  return CONTACT_REASONS.find((reason) => reason.id === id)?.label ?? id;
}

/** Checks a submission (parsed JSON or form fields) and returns either clean values or messages. */
export function validateContact(raw: Record<string, unknown>): ContactValidation {
  const errors: Partial<Record<ContactField, string>> = {};
  const reason = raw.reason;
  const reasonOther = oneLine(raw.reasonOther);
  const name = oneLine(raw.name);
  const email = oneLine(raw.email);
  const company = oneLine(raw.company);
  const message = multiLine(raw.message);

  if (!isContactReason(reason)) errors.reason = 'Choose what your message is about.';
  if (reason === 'other') {
    if (!reasonOther) errors.reasonOther = 'Tell us briefly what your message is about.';
    else if (reasonOther.length > CONTACT_LIMITS.reasonOther)
      errors.reasonOther = `Keep this under ${CONTACT_LIMITS.reasonOther} characters.`;
  }

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > CONTACT_LIMITS.name)
    errors.name = `Keep your name under ${CONTACT_LIMITS.name} characters.`;

  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > CONTACT_LIMITS.email || !EMAIL_PATTERN.test(email))
    errors.email = 'Enter an email address like name@company.ie.';

  if (company.length > CONTACT_LIMITS.company)
    errors.company = `Keep the company name under ${CONTACT_LIMITS.company} characters.`;

  if (message.length < CONTACT_LIMITS.messageMin)
    errors.message = 'Tell us a little more: at least a sentence.';
  else if (message.length > CONTACT_LIMITS.message)
    errors.message = `Keep your message under ${CONTACT_LIMITS.message} characters.`;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      reason: reason as ContactReasonId,
      reasonOther: reason === 'other' ? reasonOther : '',
      name,
      email,
      company,
      message,
    },
  };
}

export interface ContactEmail {
  subject: string;
  text: string;
  replyTo: string;
}

/** The plain-text email the team receives. Reply goes straight to the person who wrote in. */
export function composeContactEmail(input: ContactInput, receivedAt: Date): ContactEmail {
  const topic =
    input.reason === 'other' ? `Other: ${input.reasonOther}` : reasonLabel(input.reason);
  return {
    subject: `[Website] ${topic} (${input.name})`.slice(0, 200),
    replyTo: input.email,
    text: [
      `Reason: ${topic}`,
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Company: ${input.company || '(not given)'}`,
      `Received: ${receivedAt.toISOString()}`,
      '',
      input.message,
      '',
      '--',
      'Sent from the contact form at https://lightmove.ai/contact. Reply to answer the sender directly.',
    ].join('\n'),
  };
}
