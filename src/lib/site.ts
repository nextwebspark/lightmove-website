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

/**
 * The docs live on their own site, https://docs.lightmove.ai (docs-site/). Every link from this site to
 * the docs goes through DOCS_URL / docsUrl(), so a local docs server (PUBLIC_DOCS_URL=http://localhost:4322)
 * or a preview channel can stand in for it.
 */
export const DOCS_URL = (import.meta.env.PUBLIC_DOCS_URL || 'https://docs.lightmove.ai').replace(
  /\/+$/,
  '',
);

/** The absolute address of a docs page, e.g. docsUrl('/go-live/web-widget'). */
export const docsUrl = (path = '/'): string =>
  `${DOCS_URL}${path.startsWith('/') ? '' : '/'}${path}`;

export const APP = {
  url: appUrl,
  signUpUrl: appUrl,
  demoToken: import.meta.env.PUBLIC_DEMO_AGENT_TOKEN || '',
} as const;

/**
 * The /contact form posts to /api/contact, a Cloud Function (functions/). Until that function is
 * deployed with its Resend key, leave PUBLIC_CONTACT_FORM_ENABLED unset: the page then offers email
 * links instead of a form that would fail.
 */
export const CONTACT_FORM = {
  enabled: import.meta.env.PUBLIC_CONTACT_FORM_ENABLED === 'true',
  endpoint: '/api/contact',
} as const;
