# lightmove.ai

The public website, blog and documentation for [LightMove.ai](https://lightmove.ai), the AI voice agent
platform by NextWebSpark, Limerick, Ireland.

Built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build): light and dark
themes, a live voice demo powered by the LightMove.ai platform, a Markdown blog with RSS, docs with
search, Privacy and Terms pages, per-page share images and structured data.

## Develop

```bash
nvm use                 # Node 24 (npm 11)
npm ci
cp .env.example .env    # optional: set PUBLIC_DEMO_AGENT_TOKEN to wire up the live demo
npm run dev
```

Open http://localhost:4321. Before pushing, run `npm run verify` (what CI runs, minus Lighthouse).

## Write content

- **Blog:** add a Markdown file to `src/content/blog/` (copy the front matter of an existing post), or use
  the CMS at `/admin`.
- **Docs:** add Markdown under `src/content/docs/docs/<section>/`. The sidebar updates automatically.
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

Then: Actions → Release → Run workflow.
