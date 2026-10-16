// @ts-check
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lightmove.ai',
  output: 'static',
  // One trailing-slash policy, mirrored by firebase.json (`cleanUrls: true`, `trailingSlash: false`).
  trailingSlash: 'never',
  build: {
    format: 'file',
    // Inlined <style> would need 'unsafe-inline' in the CSP; every stylesheet stays a hashed file.
    inlineStylesheets: 'never',
  },
  redirects: {
    '/docs': '/docs/getting-started/introduction',
  },
  devToolbar: { enabled: false },
  integrations: [
    starlight({
      title: 'LightMove.ai Docs',
      description: 'How to build, test and run voice agents on LightMove.ai.',
      favicon: '/favicon.svg',
      logo: { src: './src/assets/mark.svg', alt: 'LightMove.ai' },
      disable404Route: true,
      credits: false,
      titleDelimiter: '—',
      customCss: [
        '@fontsource/dm-sans/400.css',
        '@fontsource/dm-sans/600.css',
        '@fontsource/sora/600.css',
        '@fontsource/jetbrains-mono/400.css',
        './src/styles/tokens.css',
        './src/styles/docs.css',
      ],
      head: [{ tag: 'meta', attrs: { name: 'theme-color', content: '#169B62' } }],
      routeMiddleware: './src/routeData.ts',
      components: {
        Head: './src/components/docs/DocsHead.astro',
        SiteTitle: './src/components/docs/DocsSiteTitle.astro',
      },
      sidebar: [
        { label: 'Get started', items: [{ autogenerate: { directory: 'docs/getting-started' } }] },
        { label: 'Build agents', items: [{ autogenerate: { directory: 'docs/build' } }] },
        { label: 'Go live', items: [{ autogenerate: { directory: 'docs/go-live' } }] },
        { label: 'Account', items: [{ autogenerate: { directory: 'docs/account' } }] },
      ],
    }),
    sitemap({
      filter: (page) =>
        !/\/(admin|404)(\/|$)/.test(new URL(page).pathname) && !page.endsWith('/docs'),
    }),
  ],
  vite: {
    // Astro inlines small scripts under this limit; an inline script would need a CSP hash.
    build: { assetsInlineLimit: 0 },
  },
});
