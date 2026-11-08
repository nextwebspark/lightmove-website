// @ts-check
// The marketing site at https://lightmove.ai. The docs are a separate Astro project in docs-site/,
// served at https://docs.lightmove.ai; firebase.json 301s the old /docs/** addresses there.
import sitemap from '@astrojs/sitemap';
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
  devToolbar: { enabled: false },
  integrations: [
    sitemap({
      filter: (page) => !/\/(admin|404|contact\/sent)(\/|$)/.test(new URL(page).pathname),
    }),
  ],
  vite: {
    // Astro inlines small scripts under this limit; an inline script would need a CSP hash.
    build: { assetsInlineLimit: 0 },
  },
});
