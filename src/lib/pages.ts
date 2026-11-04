import { SITE } from './site';

export interface StaticPageMeta {
  readonly path: string;
  readonly title: string;
  /** The headline on the page's share card, often punchier than the <title>. */
  readonly ogTitle: string;
  readonly description: string;
  readonly noindex?: boolean;
}

/** Every hand-built page's search metadata in one place, so the OG image route can render them too. */
export const staticPages = {
  home: {
    path: '/',
    title: SITE.name,
    ogTitle: 'Every call answered. Day or night.',
    description: SITE.description,
  },
  blog: {
    path: '/blog',
    title: 'Blog',
    ogTitle: 'Notes on voice AI.',
    description:
      "Guides, product news and what we're learning from building AI voice agents for Irish businesses.",
  },
  contact: {
    path: '/contact',
    title: 'Contact us',
    ogTitle: 'Talk to the LightMove team.',
    description:
      'Ask about a voice agent build, pricing, a demo or a VoIP partnership. Send us a message and the Lightmove team in Limerick will reply.',
  },
  contactSent: {
    path: '/contact/sent',
    title: 'Message sent',
    ogTitle: 'Message sent',
    description:
      "Thanks for getting in touch with Lightmove. Your message has reached our team and we'll reply by email.",
    noindex: true,
  },
  notFound: {
    path: '/404',
    title: 'Page not found',
    ogTitle: 'Page not found',
    description:
      "This page doesn't exist on lightmove.ai. Head back to the home page, the docs or the blog.",
    noindex: true,
  },
} as const satisfies Record<string, StaticPageMeta>;
