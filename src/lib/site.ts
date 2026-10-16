export const SITE = {
  name: 'LightMove.ai',
  shortName: 'LightMove',
  tld: '.ai',
  url: 'https://lightmove.ai',
  tagline: 'Voice AI agents that answer every call',
  description:
    'LightMove.ai builds voice agents that answer the phone, book appointments and hand over to your team. Made in Limerick, Ireland.',
  company: 'NextWebSpark',
  location: 'Limerick, Ireland',
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

export function absoluteUrl(path: string): string {
  return new URL(path, SITE.url).toString().replace(/\/$/, '') || SITE.url;
}

export function contactHref(subject: string): string {
  return `mailto:${SITE.emails.hello}?subject=${encodeURIComponent(subject)}`;
}
