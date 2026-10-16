import { SITE } from '../site';

/**
 * The site's one trailing-slash policy is "never" (astro.config `trailingSlash`, firebase.json
 * `trailingSlash: false`). Every absolute URL goes through here so canonical, sitemap, OG and JSON-LD
 * can never disagree about a page's address.
 */
export function absoluteUrl(pathOrUrl: string, origin: string = SITE.url): string {
  const url = new URL(pathOrUrl, origin);
  url.hash = '';
  url.search = '';
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }
  if (url.pathname.endsWith('.html')) {
    url.pathname = url.pathname.replace(/(\/index)?\.html$/, '') || '/';
  }
  return url.href;
}

export function ogImagePathFor(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  return `/og/${trimmed === '' ? 'index' : trimmed}.png`;
}
