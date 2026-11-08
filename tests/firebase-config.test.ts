import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import astroConfig from '../astro.config.mjs';
import docsAstroConfig from '../docs-site/astro.config.mjs';
import {
  effectiveHeaders,
  globToRegExp,
  HOSTING_TARGETS,
  loadHostingConfig,
  parseCsp,
} from '../scripts/lib/firebase-headers';

const hosting = loadHostingConfig('website');
const docsHosting = loadHostingConfig('docs');
const headersFor = (path: string) => effectiveHeaders(hosting.headers, path);
const cspFor = (path: string) => parseCsp(headersFor(path).get('content-security-policy'));
const docsHeadersFor = (path: string) => effectiveHeaders(docsHosting.headers, path);
const docsCspFor = (path: string) => parseCsp(docsHeadersFor(path).get('content-security-policy'));

describe('firebase.json header globs', () => {
  it('match the way Firebase roots and expands them', () => {
    expect(globToRegExp('**').test('/')).toBe(true);
    expect(globToRegExp('/admin{,/**}').test('/admin')).toBe(true);
    expect(globToRegExp('/admin{,/**}').test('/admin/config.yml')).toBe(true);
    expect(globToRegExp('/admin{,/**}').test('/administrator')).toBe(false);
    expect(globToRegExp('/_astro/**').test('/blog')).toBe(false);
  });
});

describe('hosting config', () => {
  it('serves the Astro build with the same trailing-slash policy Astro builds with', () => {
    expect(hosting.public).toBe('dist');
    expect(hosting.cleanUrls).toBe(true);
    expect(hosting.trailingSlash).toBe(false);
    expect(astroConfig.trailingSlash).toBe('never');
    expect(astroConfig.build?.format).toBe('file');
  });

  it('serves the docs build at docs.lightmove.ai with the same trailing-slash policy', () => {
    expect(docsHosting.public).toBe('docs-site/dist');
    expect(docsHosting.cleanUrls).toBe(true);
    expect(docsHosting.trailingSlash).toBe(false);
    expect(docsAstroConfig.site).toBe('https://docs.lightmove.ai');
    expect(docsAstroConfig.trailingSlash).toBe('never');
    expect(docsAstroConfig.build?.format).toBe('file');
  });

  it('maps every Hosting target to a site in .firebaserc', () => {
    const rc = JSON.parse(readFileSync('.firebaserc', 'utf8')) as {
      projects: { default: string };
      targets: Record<string, { hosting: Record<string, string[]> }>;
    };
    const targets = rc.targets[rc.projects.default]?.hosting ?? {};
    for (const target of HOSTING_TARGETS) expect(targets[target]).toHaveLength(1);
  });

  it('301s every old docs address to the same path on docs.lightmove.ai', () => {
    expect(hosting.redirects).toContainEqual({
      source: '/docs',
      destination: 'https://docs.lightmove.ai/',
      type: 301,
    });
    expect(hosting.redirects).toContainEqual({
      source: '/docs/:path*',
      destination: 'https://docs.lightmove.ai/:path',
      type: 301,
    });
    expect(astroConfig.redirects?.['/docs']).toBeUndefined();
  });

  it('opens the introduction at the docs root, the way the docs build does', () => {
    expect(docsHosting.redirects).toContainEqual({
      source: '/',
      destination: '/getting-started/introduction',
      type: 302,
    });
    expect(docsAstroConfig.redirects?.['/']).toBe('/getting-started/introduction');
  });

  it.each(['/', '/blog/some-post', '/admin'])(
    'sends the baseline security headers on %s',
    (path) => {
      const headers = headersFor(path);

      expect(headers.get('strict-transport-security')).toBe(
        'max-age=63072000; includeSubDomains; preload',
      );
      expect(headers.get('x-content-type-options')).toBe('nosniff');
      expect(headers.get('x-frame-options')).toBe('DENY');
      expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(headers.get('permissions-policy')).toContain('camera=()');
      expect(cspFor(path).get('frame-ancestors')).toEqual(["'none'"]);
    },
  );

  it('lets site pages reach only the platform for the voice demo, and use the microphone', () => {
    const csp = cspFor('/');

    expect(csp.get('script-src')).toEqual(["'self'", 'https://app.lightmove.ai']);
    expect(csp.get('connect-src')).toEqual([
      "'self'",
      'https://app.lightmove.ai',
      'wss://app.lightmove.ai',
    ]);
    expect(headersFor('/').get('permissions-policy')).toContain('microphone=(self)');
  });

  it.each(['/', '/getting-started/introduction', '/integrations/telephony/twilio'])(
    'sends the baseline security headers on docs %s',
    (path) => {
      const headers = docsHeadersFor(path);

      expect(headers.get('strict-transport-security')).toBe(
        'max-age=63072000; includeSubDomains; preload',
      );
      expect(headers.get('x-content-type-options')).toBe('nosniff');
      expect(headers.get('x-frame-options')).toBe('DENY');
      expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
      expect(headers.get('permissions-policy')).toContain('camera=()');
      expect(docsCspFor(path).get('frame-ancestors')).toEqual(["'none'"]);
    },
  );

  it('loosens the docs only as far as Starlight and Pagefind need', () => {
    const scriptSrc = docsCspFor('/go-live/web-widget').get('script-src') ?? [];

    expect(scriptSrc).toContain("'wasm-unsafe-eval'");
    expect(scriptSrc.some((source) => source.startsWith('https:'))).toBe(false);
    expect(cspFor('/').get('script-src')).not.toContain("'wasm-unsafe-eval'");
  });

  it('allows the CMS its CDN and GitHub only under /admin, which is never indexed', () => {
    expect(cspFor('/admin').get('script-src')).toContain('https://unpkg.com');
    expect(cspFor('/admin').get('connect-src')).toContain('https://api.github.com');
    expect(headersFor('/admin').get('x-robots-tag')).toBe('noindex, nofollow');

    expect(cspFor('/blog').get('script-src')).not.toContain('https://unpkg.com');
    expect(headersFor('/blog').get('x-robots-tag')).toBeUndefined();
  });

  it('serves the contact form endpoint same-origin from the EU function, never cached', () => {
    expect(hosting.rewrites).toContainEqual({
      source: '/api/contact',
      function: { functionId: 'contact', region: 'europe-west1' },
    });
    expect(headersFor('/api/contact').get('cache-control')).toBe('no-store');
    expect(cspFor('/contact').get('form-action')).toEqual(["'self'"]);
    expect(cspFor('/contact').get('connect-src')).toContain("'self'");
  });

  it('caches hashed assets forever and HTML not at all', () => {
    expect(headersFor('/_astro/index.Bx1.css').get('cache-control')).toBe(
      'public, max-age=31536000, immutable',
    );
    expect(headersFor('/privacy').get('cache-control')).toBe('public, max-age=0, must-revalidate');
  });
});
