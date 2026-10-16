# lightmove.ai

The public website, blog and documentation for [LightMove.ai](https://lightmove.ai), the voice AI agent
platform by NextWebSpark, Limerick, Ireland.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build). Light and dark
themes, a live voice demo powered by the LightMove.ai platform, a Markdown blog with RSS, docs with search,
and Privacy / Terms pages.

## Develop

```bash
nvm use            # Node 22
npm install
cp .env.example .env   # optional: set PUBLIC_DEMO_AGENT_TOKEN to wire up the live demo
npm run dev
```

Open http://localhost:4321.

## Write content

- **Blog:** add a Markdown file to `src/content/blog/` (see existing posts for the front matter), or use the
  CMS at `/admin` once deployed.
- **Docs:** add Markdown under `src/content/docs/docs/<section>/`. The sidebar updates automatically.
- **Legal:** edit `src/content/legal/privacy.md` and `terms.md`. Set `reviewedByCounsel: true` once approved.

## Deploy

The site is static (`npm run build` → `dist/`). `firebase.json` is ready for Firebase Hosting with security
headers. Before the first deploy:

1. Create a Firebase project and Hosting site, then set the project id in `.firebaserc`.
2. Point `lightmove.ai` at Firebase Hosting (Cloudflare DNS, DNS-only records as Firebase lists them).
3. Set `PUBLIC_DEMO_AGENT_TOKEN` in the build environment.
4. `npx firebase-tools deploy --only hosting`

A GitHub Actions deploy workflow can be added once the project and credentials exist.

## Checks

```bash
npm run verify               # astro check + build
node scripts/csp-hashes.mjs  # no inline scripts on site pages
```
