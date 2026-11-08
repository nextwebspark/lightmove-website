// @ts-check
// The docs site at https://docs.lightmove.ai. A second Astro project (`astro --root docs-site`) in the
// same npm package as the marketing site: it shares node_modules, the colour tokens, the brand mark and
// the SEO/OG helpers in ../src, but has its own pages, content, public files and dist. Neither build can
// emit the other's pages.
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  site: 'https://docs.lightmove.ai',
  output: 'static',
  // The same trailing-slash policy as the marketing site, mirrored by the `docs` target in firebase.json.
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Inlined <style> would need 'unsafe-inline' in the CSP; every stylesheet stays a hashed file.
    inlineStylesheets: 'never',
  },
  // No docs home page yet, so the root opens the introduction. firebase.json does the same with a 302.
  redirects: {
    '/': '/getting-started/introduction',
  },
  server: { port: 4322 },
  devToolbar: { enabled: false },
  integrations: [
    starlight({
      title: 'LightMove.ai Docs',
      description: 'How to build, test and run voice agents on LightMove.ai.',
      favicon: '/favicon.svg',
      logo: { src: '../src/assets/mark.svg', alt: 'LightMove.ai' },
      credits: false,
      titleDelimiter: '—',
      customCss: [
        '@fontsource/dm-sans/400.css',
        '@fontsource/dm-sans/600.css',
        '@fontsource/sora/600.css',
        '@fontsource/jetbrains-mono/400.css',
        '../src/styles/tokens.css',
        './src/styles/docs.css',
      ],
      head: [{ tag: 'meta', attrs: { name: 'theme-color', content: '#169B62' } }],
      routeMiddleware: './src/routeData.ts',
      components: {
        Head: './src/components/DocsHead.astro',
        SiteTitle: './src/components/DocsSiteTitle.astro',
      },
      sidebar: [
        { label: 'Get started', items: [{ autogenerate: { directory: 'getting-started' } }] },
        { label: 'Build agents', items: [{ autogenerate: { directory: 'build' } }] },
        { label: 'Go live', items: [{ autogenerate: { directory: 'go-live' } }] },
        {
          label: 'Integrations',
          items: [
            {
              label: 'Telephony',
              items: [{ autogenerate: { directory: 'integrations/telephony' } }],
            },
            { slug: 'integrations/paygent' },
            { slug: 'integrations/tuner' },
          ],
        },
        { label: 'Account', items: [{ autogenerate: { directory: 'account' } }] },
      ],
    }),
    sitemap({
      // The root is a redirect, and the 404 page is not a page.
      filter: (page) => !['/', '/404'].includes(new URL(page).pathname),
    }),
  ],
  vite: {
    // One .env for both sites, at the repository root.
    envDir: repoRoot,
    // Astro inlines small scripts under this limit; an inline script would need a CSP hash.
    build: { assetsInlineLimit: 0 },
    // Shared tokens, components and libraries live in ../src.
    server: { fs: { allow: [repoRoot] } },
  },
});
