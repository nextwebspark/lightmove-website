# lightmove.ai

The public website and blog for [LightMove.ai](https://lightmove.ai), the AI voice agent platform by
NextWebSpark, Limerick, Ireland, and its documentation at [docs.lightmove.ai](https://docs.lightmove.ai).

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build): light and dark
themes, a live voice demo powered by the LightMove.ai platform, a Markdown blog with RSS, docs with
search, Privacy and Terms pages, per-page share images and structured data.

Two sites, one repository and one `npm ci`:

| Site                | Astro project                      | Build output      | Firebase Hosting target |
| ------------------- | ---------------------------------- | ----------------- | ----------------------- |
| `lightmove.ai`      | the repo root (`astro.config.mjs`) | `dist/`           | `website`               |
| `docs.lightmove.ai` | `docs-site/` (`--root docs-site`)  | `docs-site/dist/` | `docs`                  |

## Develop

```bash
nvm use                 # Node 24 (npm 11)
npm ci
cp .env.example .env    # optional: set PUBLIC_DEMO_AGENT_TOKEN to wire up the live demo
npm run dev             # the marketing site on http://localhost:4321
npm run dev:docs        # the docs site on http://localhost:4322
```

The marketing site links its "Docs" items to `https://docs.lightmove.ai`. To follow them to your local
docs server instead, set `PUBLIC_DOCS_URL=http://localhost:4322` in `.env` (or the shell) before
`npm run dev`.

`npm run build` builds both sites; `build:site` and `build:docs` build one. Before pushing, run
`npm run verify` (what CI runs, minus Lighthouse).

## Write content

- **Blog:** add a Markdown file to `src/content/blog/` (copy the front matter of an existing post), or use
  the CMS at `/admin`.
- **Docs:** add Markdown under `docs-site/src/content/docs/<section>/`; it is served at
  `docs.lightmove.ai/<section>/<page>`. The sidebar updates automatically. Link other docs pages with a
  relative path (`/go-live/telephony`) and marketing pages with the full address
  (`https://lightmove.ai/contact`).
- **Legal:** edit `src/content/legal/privacy.md` and `terms.md`. Set `reviewedByCounsel: true` once approved.

Titles stay under about 50 characters and descriptions between 50 and 160; the build checks both.

## How changes ship

```
PR ──► CI (lint · format · types · tests · build · CSP + SEO audits · Lighthouse) ──► merge to main
                └─► Preview channel URL commented on the PR
main ──► Actions → Release (patch | minor | major) ──► tag vX.Y.Z + release notes ──► Deploy ──► smoke test
```

- Nothing deploys on merge. **Release** is the only way to production.
- **Rollback:** Actions → Deploy → run with an older tag.
- `main` only accepts pull requests whose CI is green; release tags can't be moved or deleted.

## First-time setup

1. **GCP + Firebase:** `./scripts/gcp-bootstrap.sh` (project defaults to `dograh-eu`; override with
   `GCP_PROJECT`). Creates the Hosting site, a deploy service account and Workload Identity Federation
   for this repo. No keys.
2. **Repository variables:** the bootstrap prints the `gh variable set` commands
   (`GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `PUBLIC_APP_URL`,
   `PUBLIC_DEMO_AGENT_TOKEN`, then `PUBLIC_BASE_URL`).
3. **Merge gate:** `./scripts/github-protect.sh` (main needs green CI through a PR; `v*` tags immutable).
   Rulesets on a private repository need a paid GitHub plan.
4. **Environment:** Settings → Environments → `production`, deployment branches limited to `main`.
5. **Domain:** Firebase Hosting → Add custom domain `lightmove.ai` (+ `www` redirect). Cloudflare records
   as DNS only.
6. **Search:** add the site to Google Search Console and submit `https://lightmove.ai/sitemap-index.xml`.
7. **Docs site:** see below.

Then: Actions → Release → Run workflow.

## The docs site (docs.lightmove.ai)

The docs used to live at `lightmove.ai/docs/...`. They are now their own Firebase Hosting site, and
`firebase.json` 301s every old address to the same path on the new host
(`lightmove.ai/docs/integrations/telephony/twilio` → `docs.lightmove.ai/integrations/telephony/twilio`).
One-time steps for the project owner, before the first release that contains this change:

1. **Create the Hosting site.** Re-run `./scripts/gcp-bootstrap.sh` (it creates `lightmove-docs` next
   to `lightmove-website`), or by hand:
   `npx firebase-tools hosting:sites:create lightmove-docs --project dograh-eu`.
   Site ids are global: if `lightmove-docs` is taken, pick another id and put it in `.firebaserc`
   (`targets.dograh-eu.hosting.docs`).
2. **Targets.** `.firebaserc` maps the `website` and `docs` targets to their sites for the project
   `dograh-eu`. If `FIREBASE_PROJECT_ID` is a different project, map them for that project too:
   `npx firebase-tools target:apply hosting website lightmove-website --project <id>` and
   `npx firebase-tools target:apply hosting docs lightmove-docs --project <id>`, then commit
   `.firebaserc`.
3. **Custom domain.** Firebase console → Hosting → site `lightmove-docs` → Add custom domain →
   `docs.lightmove.ai`. Firebase shows the records to add, typically an `A` record for `docs` (or a
   `CNAME` to `lightmove-docs.web.app`) plus a `TXT` record to prove ownership. Add exactly what it shows
   in Cloudflare as **DNS only** (grey cloud), then wait for Firebase to verify and issue the
   certificate (minutes to a few hours).
4. **Repository variable.** Once `https://docs.lightmove.ai` serves the docs:
   `gh variable set PUBLIC_DOCS_URL --repo nextwebspark/lightmove-website --body 'https://docs.lightmove.ai'`.
   Unset, the build still links to `https://docs.lightmove.ai`; the Deploy smoke test then checks the
   docs at `https://lightmove-docs.web.app` instead.
5. **Search.** Add `docs.lightmove.ai` to Google Search Console as its own property and submit
   `https://docs.lightmove.ai/sitemap-index.xml`.
6. **The app.** failte-ai links its provider forms to `https://lightmove.ai/docs/<page>`. The 301s keep
   those links working; point them at `https://docs.lightmove.ai/<page>` when convenient.

Release as usual: Deploy builds both sites and `firebase deploy --only hosting` ships both targets.
Pull request previews get one channel per site; the website preview links to the docs preview.
