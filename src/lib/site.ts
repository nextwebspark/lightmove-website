export const SITE = {
  name: 'LightMove.ai',
  shortName: 'LightMove',
  url: 'https://lightmove.ai',
  tagline: 'AI voice agents for business',
  description:
    'LightMove.ai builds AI voice agents that answer your phone, book appointments and hand over to your team. Made in Limerick, Ireland.',
  company: 'NextWebSpark',
  location: 'Limerick, Ireland',
  locale: 'en-IE',
  ogLocale: 'en_IE',
  themeColor: '#169B62',
  /** Official profiles for Organization.sameAs. Add each one as it goes live; never a placeholder. */
  sameAs: [] as readonly string[],
  emails: {
    hello: 'hello@lightmove.ai',
    privacy: 'privacy@lightmove.ai',
    legal: 'legal@lightmove.ai',
  },
} as const;

const appUrl = (import.meta.env.PUBLIC_APP_URL || 'https://app.lightmove.ai').replace(/\/+$/, '');

export const APP = {
  url: appUrl,
  signUpUrl: appUrl,
  demoToken: import.meta.env.PUBLIC_DEMO_AGENT_TOKEN || '',
} as const;

export function contactHref(subject: string): string {
  return `mailto:${SITE.emails.hello}?subject=${encodeURIComponent(subject)}`;
}
