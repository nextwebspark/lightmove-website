/**
 * The docs site's own address, the one its canonicals, sitemap, OG images and JSON-LD use. It matches
 * `site` in docs-site/astro.config.mjs and never follows PUBLIC_DOCS_URL, which only tells the marketing
 * site where to link (a local dev server, a preview channel).
 */
export const DOCS_SITE = {
  name: 'LightMove.ai Docs',
  url: 'https://docs.lightmove.ai',
} as const;
