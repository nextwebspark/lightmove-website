# LightMove.ai website

The public site for **LightMove.ai** — AI voice agents — at `https://lightmove.ai`: marketing pages, the
blog and the legal pages; plus the docs at `https://docs.lightmove.ai`, a second Astro + Starlight
project in `docs-site/` deployed as its own Firebase Hosting site (target `docs`). The product is a
separate codebase (`nextwebspark/failte-ai`) running at `https://app.lightmove.ai`; this site only
links to it and loads its embeddable voice widget for the home page demo. Static Astro builds served by
Firebase Hosting, blog editable through Sveltia CMS at `/admin`. The setup follows `nextwebspark/uncava-website`.

## Commands

```bash
npm run dev          # marketing site dev server (http://localhost:4321)
npm run dev:docs     # docs site dev server (http://localhost:4322); PUBLIC_DOCS_URL points links at it
npm run build        # both static builds: dist/ (marketing) and docs-site/dist/ (docs)
npm run build:site   # marketing only (pages, OG images, sitemap, RSS, llms.txt)
npm run build:docs   # docs only (pages, OG images, sitemap, llms.txt, Pagefind search)
npm run preview      # serve dist/ locally (preview:docs for docs-site/dist/)
npm run verify       # everything CI runs except Lighthouse: lint, format, check, test, build, CSP + SEO audits
npm run check        # astro check + tsc, for both projects
npm test             # vitest
npm run check:csp    # post-build, both sites: every page runs under the CSP firebase.json serves it with
npm run check:seo    # post-build, both sites: one h1, title ≤ 60, description 50–160, canonical, OG image, JSON-LD
npm run lhci         # Lighthouse CI against both dists (needs Chrome; CHROME_PATH locally)
```

Use npm 11 (bundled with Node 24, see `.nvmrc`). npm 10 fails to resolve vitest 5's optional peers.

## Layout

| Path                                  | What                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `design/*.dc.html`                    | **Source of truth for the UI** (exported from the design canvas). Read before changing UI.        |
| `src/pages/`                          | Routes: home, `blog/`, `contact` (+ `contact/sent`), legal pages incl. `cookies`, `404`, `og/`.   |
| `src/components/{site,home,blog,seo}` | Astro components grouped by where they are used.                                                  |
| `src/layouts/`                        | `BaseLayout` (every marketing page, renders `Seo`) and `LegalLayout`.                             |
| `src/content/`                        | `blog/*.md`, `authors/*.json`, `legal/*.md`.                                                      |
| `src/lib/`                            | Pure TS: site constants (`DOCS_URL`, `docsUrl()`), page metadata, schemas, SEO, OG renderer.      |
| `src/styles/`                         | `tokens.css` (colours, light + dark, shared with the docs site), `global.css`.                    |
| `public/`                             | `theme-init.js`, icons (`scripts/make-icons.mjs`), `site.webmanifest`, `robots.txt`, CMS.         |
| `docs-site/`                          | The docs site (own `astro.config.mjs`, `public/`, `dist/`). Shares tokens and helpers in `src/`.  |
| `docs-site/src/content/docs/`         | Docs Markdown; `<section>/<page>.md` is served at `docs.lightmove.ai/<section>/<page>`.           |
| `docs-site/src/`                      | Starlight overrides (`components/`), `routeData.ts` (clean canonicals), `docs.css`, OG, llms.txt. |
| `scripts/`                            | `check-csp.ts`, `check-seo.ts`, `gcp-bootstrap.sh`, `github-protect.sh`, `make-icons.mjs`.        |
| `tests/`                              | Config tests: `firebase.json` headers, CMS ↔ schema lockstep. Unit tests sit beside modules.      |
| `functions/`                          | Cloud Function `contact` behind `/api/contact` (Resend → hello@). Setup: `functions/README.md`.   |

## Pipeline

- **CI** (`ci.yml`) runs on every PR and on main: lint, format, type check, tests, build, CSP audit, SEO
  audit, Lighthouse (performance ≥ 0.9, accessibility and best practices ≥ 0.95, SEO = 1). Its job name,
  `Lint, check, test, build, Lighthouse`, is the required check in the main ruleset
  (`scripts/github-protect.sh`) and the gate Release reads. Renaming it breaks both.
- **Preview** (`preview.yml`) deploys each PR to a 7-day Firebase channel and comments the URL.
- **Release** (`release.yml`, manual) requires green CI on main, tags `vX.Y.Z`, publishes release notes and
  calls **Deploy**. Merging to main deploys nothing.
- **Deploy** (`deploy.yml`) only ships release tags, runs `verify`, stamps `/version.json`, deploys and
  smoke-tests the live site. Running Deploy on an older tag is the rollback.
- Auth is Workload Identity Federation (`scripts/gcp-bootstrap.sh`); there are no secrets in the repo.
  Everything the build needs is a repository variable.

## Invariants

- **Every indexable page has one `h1`, a unique title (≤ 60 chars with the brand) and description
  (50–160), a canonical without `.html` or a trailing slash, and its own OG image** at
  `ogImagePathFor(path)`. Hand-built pages register their metadata in `src/lib/pages.ts`; the OG route
  renders a card for every page, post, tag, legal page and doc. `check:seo` enforces this on the build.
- **Structured data:** Organization, WebSite, SoftwareApplication and FAQPage on home; BlogPosting and
  BreadcrumbList on posts; BreadcrumbList on tags, legal and docs. FAQ answers come from `src/lib/faqs.ts`
  and must contain no placeholders. Never add `sameAs`, ratings or prices that aren't real.
- **One trailing-slash policy:** Astro `trailingSlash: 'never'` + `build.format: 'file'`, Firebase
  `cleanUrls: true` + `trailingSlash: false`. Every absolute URL goes through `absoluteUrl()`.
- **Brand:** colours and type come from `src/styles/tokens.css` (the LightMove brand kit in
  `failte-ai/brand-kit/lightmove-brand/`). Light theme is the brand kit; dark theme is the app's charcoal
  (`#0B0D11` / `#14181F` / `#1C212A`) with mint `#3DDC97` as the only accent. Spark orange is for the
  live dot and small accents only, never text.
- **No inline scripts on site pages.** Component `<script>`s are bundled to files; `theme-init.js` is a
  public file; JSON-LD is data, not script. The CSP in `firebase.json` is self-only plus
  `app.lightmove.ai` for the widget. The docs target allows Starlight's fixed inline scripts by hash;
  `check:csp` prints the new hash after a Starlight upgrade.
- **Inline `style` attributes are allowed** (`style-src 'unsafe-inline'`); keep them for per-element values
  (sizes, delays), put everything else in component `<style>`.
- **`global.css` sits in `@layer site`** so a component's scoped styles always override it.
- **No invented facts.** Product claims must match what the app does. Unknowns are visible bracketed
  placeholders (`[€X]`, `[RETENTION PERIOD]`). Never write prices, metrics or testimonials.
- **Legal pages are drafts** until counsel sets `reviewedByCounsel: true`, which removes the notice.
- **CMS config and content schemas change together** (`tests/cms-config.test.ts`).
- **A changed or removed URL gets a 301 in `firebase.json`.** The old `lightmove.ai/docs/**` addresses
  301 to the same path on `docs.lightmove.ai`.
- **Docs links:** the marketing site links to the docs only through `docsUrl()` in `src/lib/site.ts`
  (`PUBLIC_DOCS_URL`, default `https://docs.lightmove.ai`); Markdown content uses the full
  `https://docs.lightmove.ai/...` address. Docs pages link each other with relative paths and the
  marketing site with full `https://lightmove.ai/...` addresses.
- **Motion respects `prefers-reduced-motion`.**

## Contact form and cookies

- `/contact` shows the form only when `PUBLIC_CONTACT_FORM_ENABLED=true` (build-time repository variable);
  otherwise it offers email links. Deploy ships the function only when `DEPLOY_FUNCTIONS=true`. Fields,
  reasons and limits live in `src/lib/contact.ts`, shared by the page and the function.
- **The cookie banner asks about planned categories only.** `src/lib/consent.ts` lists Analytics and
  Error monitoring with `inUse: false`; the banner, the settings dialog and `/cookies` say they don't
  run yet. Switching a tool on means: name it in `content/legal/cookies.md` and Privacy, list its
  storage in `STORAGE_ITEMS`, load it only after `hasConsent()`, set `inUse: true` and bump
  `CONSENT_VERSION` so everyone is asked again. "Cookieless" tools still need a category (EDPB 2/2023).

## Demo agent

`PUBLIC_DEMO_AGENT_TOKEN` (build-time repository variable) is the embed token of the agent the hero demo
talks to. Create it in the app with embed mode **headless** and `lightmove.ai` allowed. Without it the
button explains the demo isn't connected yet.
