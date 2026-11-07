import { CONTACT_REASONS, type ContactReasonId } from './contact';

/**
 * How the contact form reads for each topic: a short hint, an example message
 * and the send button's label. The fields stay the same for every topic, so
 * the contact function validates them as before.
 */
export type ContactTopicCopy = {
  chip: string;
  hint: string;
  placeholder: string;
  submit: string;
};

export const CONTACT_TOPIC_COPY: Record<ContactReasonId, ContactTopicCopy> = {
  build: {
    chip: 'Build me a voice agent',
    hint: 'Tell us about your business, what callers ask most, and the phone system or calendar you use.',
    placeholder:
      "We're a dental practice in Cork. Most callers want to book, move or cancel an appointment, and we use Google Calendar.",
    submit: 'Send my request',
  },
  demo: {
    chip: 'Book a demo or a call',
    hint: "Tell us a few days and times that suit you, and what you'd like to see.",
    placeholder:
      'Tuesday or Thursday morning works. We would like to see bookings and passing calls to staff.',
    submit: 'Request a demo',
  },
  pricing: {
    chip: 'Pricing and billing',
    hint: 'Ask about rates, volume pricing, invoices or topping up credit.',
    placeholder:
      'We expect about 2,000 minutes a month across two locations. Is there a volume rate?',
    submit: 'Ask about pricing',
  },
  partnership: {
    chip: 'VoIP or reseller partnership',
    hint: 'Tell us about your customers and the phone platform you run.',
    placeholder:
      'We run a hosted PBX for about 300 Irish businesses and would like to offer an AI receptionist.',
    submit: 'Start the conversation',
  },
  support: {
    chip: 'Help with my account',
    hint: "Tell us the email you sign in with, what happened and when. Please don't send passwords.",
    placeholder: 'I sign in as anne@company.ie. Since this morning my agent does not answer calls.',
    submit: 'Get help',
  },
  privacy: {
    chip: 'Privacy or my data',
    hint: 'For a data request, tell us which email address or phone number it is about.',
    placeholder: 'Please send me a copy of the data you hold about the number 087 123 4567.',
    submit: 'Send my request',
  },
  other: {
    chip: 'Something else',
    hint: 'Tell us what your message is about.',
    placeholder: 'Your message',
    submit: 'Send message',
  },
};

export const CONTACT_TOPICS = CONTACT_REASONS.map((reason) => ({
  id: reason.id,
  ...CONTACT_TOPIC_COPY[reason.id],
}));

/** The topic a link asks for: `?reason=` (our own links) or `?kind=`. */
export function topicFromSearch(search: string): ContactReasonId | null {
  const params = new URLSearchParams(search);
  const wanted = params.get('reason') ?? params.get('kind');
  return CONTACT_REASONS.some((r) => r.id === wanted) ? (wanted as ContactReasonId) : null;
}
