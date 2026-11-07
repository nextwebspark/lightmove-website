/**
 * Ways to start an email to us. A `mailto:` link only works when the visitor's
 * computer has an email app set up; many people use Gmail or Outlook in the
 * browser instead, and then a mailto click silently does nothing. So the
 * contact page also offers webmail compose links and a copy button.
 */

export function mailtoUrl(to: string, subject?: string): string {
  return subject ? `mailto:${to}?subject=${encodeURIComponent(subject)}` : `mailto:${to}`;
}

export function gmailComposeUrl(to: string, subject?: string): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to });
  if (subject) params.set('su', subject);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

/** Outlook on the web (Microsoft 365 work and school accounts). */
export function outlookComposeUrl(to: string, subject?: string): string {
  const params = new URLSearchParams({ to });
  if (subject) params.set('subject', subject);
  return `https://outlook.office.com/mail/deeplink/compose?${params.toString()}`;
}
