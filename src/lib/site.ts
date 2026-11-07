/** The CRO record. Companies Act 2014 s.151 requires these on the website. */
const LEGAL = {
  entity: 'Nextwebspark Limited',
  tradingName: 'Lightmove',
  companyNumber: '779540',
  registeredIn: 'Ireland',
  registeredOffice: '48 The Woods, Ros Mór, Crossagalla, Limerick, V94 8D51, Ireland',
} as const;

export const SITE = {
  name: 'LightMove.ai',
  shortName: 'LightMove',
  url: 'https://lightmove.ai',
  tagline: 'AI voice agents for business',
  description:
    'LightMove.ai builds AI voice agents that answer your phone, book appointments and hand over to your team. Made in Limerick, Ireland.',
  company: LEGAL.entity,
  legal: LEGAL,
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

/**
 * The /contact form posts to /api/contact, a Cloud Function (functions/) that sends through Resend.
 * The form is on by default; set PUBLIC_CONTACT_FORM_ENABLED=false only to fall back to email links
 * (for example while the function or its RESEND_API_KEY secret is unavailable).
 */
export const CONTACT_FORM = {
  enabled: import.meta.env.PUBLIC_CONTACT_FORM_ENABLED !== 'false',
  endpoint: '/api/contact',
} as const;
