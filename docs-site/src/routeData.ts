import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { absoluteUrl } from '../../src/lib/seo/url';
import { DOCS_SITE } from './site';

/**
 * With `build.format: 'file'` Starlight derives the canonical and og:url from the built file, so they
 * end in `.html`. Firebase serves the clean URL, and so must every address a docs page declares.
 * Starlight's 404 page (served by Firebase for any unknown docs address) stays out of search.
 */
export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const clean = absoluteUrl(context.url.pathname, DOCS_SITE.url);
  if (route.entry.id === '404') {
    route.head.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } });
  }
  for (const entry of route.head) {
    if (entry.tag === 'link' && entry.attrs?.rel === 'canonical') entry.attrs.href = clean;
    if (entry.tag === 'meta' && entry.attrs?.property === 'og:url') entry.attrs.content = clean;
  }
});
