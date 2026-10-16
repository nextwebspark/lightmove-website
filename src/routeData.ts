import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { absoluteUrl } from './lib/seo/url';

/**
 * With `build.format: 'file'` Starlight derives the canonical and og:url from the built file, so they
 * end in `.html`. Firebase serves the clean URL, and so must every address a docs page declares.
 */
export const onRequest = defineRouteMiddleware((context) => {
  const clean = absoluteUrl(context.url.pathname);
  for (const entry of context.locals.starlightRoute.head) {
    if (entry.tag === 'link' && entry.attrs?.rel === 'canonical') entry.attrs.href = clean;
    if (entry.tag === 'meta' && entry.attrs?.property === 'og:url') entry.attrs.content = clean;
  }
});
