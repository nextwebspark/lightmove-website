# LightMove.ai website

The public site for **LightMove.ai** — AI voice agents — at `https://lightmove.ai`: marketing pages, the
blog, the docs and the legal pages. The product is a separate codebase (`nextwebspark/failte-ai`) running
at `https://app.lightmove.ai`; this site only links to it and loads its embeddable voice widget for the
home page demo. Static Astro build served by Firebase Hosting, blog editable through Sveltia CMS at
`/admin`. The setup follows `nextwebspark/uncava-website`.

## Commands

```bash
npm run dev          # local dev server (http://localhost:4321)
npm run build        # static build into dist/ (pages, OG images, sitemap, RSS, llms.txt)
npm run preview      # serve dist/ locally
npm run verify       # everything CI runs except Lighthouse: lint, format, check, test, build, CSP + SEO audits
npm run check        # astro check + tsc
npm test             # vitest
npm run check:csp    # post-build: every page runs under the CSP firebase.json serves it with
npm run check:seo    # post-build: one h1, title ≤ 60, description 50–160, canonical, OG image, valid JSON-LD
npm run lhci         # Lighthouse CI against dist (needs Chrome; CHROME_PATH locally)
```

Use npm 11 (bundled with Node 24, see `.nvmrc`). npm 10 fails to resolve vitest 5's optional peers.

## Layout

| Path                                       | What                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `design/*.dc.html`                         | **Source of truth for the UI** (exported from the design canvas). Read before changing UI.       |
| `src/pages/`                               | Routes: home, `blog/` (index, post, tag, RSS), `privacy`, `terms`, `404`, `og/`, `llms.txt`.     |
| `src/components/{site,home,blog,docs,seo}` | Astro components grouped by where they are used.                                                 |
| `src/layouts/`                             | `BaseLayout` (every non-docs page, renders `Seo`) and `LegalLayout`.                             |
| `src/content/`                             | `blog/*.md`, `authors/*.json`, `legal/*.md`, `docs/docs/**/*.md` (Starlight, at `/docs`).        |
| `src/lib/`                                 | Pure TS: site constants, page metadata (`pages.ts`), content schemas, SEO builders, OG renderer. |
| `src/routeData.ts`                         | Starlight route middleware: clean canonical/og:url on docs pages.                                |
| `src/styles/`                              | `tokens.css` (colours, light + dark, shared with docs), `global.css`, `docs.css`.                |
| `public/`                                  | `theme-init.js`, icons (`scripts/make-icons.mjs`), `site.webmanifest`, `robots.txt`, CMS.        |
| `scripts/`                                 | `check-csp.ts`, `check-seo.ts`, `gcp-bootstrap.sh`, `github-protect.sh`, `make-icons.mjs`.       |
| `tests/`                                   | Config tests: `firebase.json` headers, CMS ↔ schema lockstep. Unit tests sit beside modules.     |

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
  `app.lightmove.ai` for the widget. Docs allow Starlight's fixed inline scripts by hash; `check:csp`
  prints the new hash after a Starlight upgrade.
- **Inline `style` attributes are allowed** (`style-src 'unsafe-inline'`); keep them for per-element values
  (sizes, delays), put everything else in component `<style>`.
- **`global.css` sits in `@layer site`** so a component's scoped styles always override it.
- **No invented facts.** Product claims must match what the app does. Unknowns are visible bracketed
  placeholders (`[€X]`, `[RETENTION PERIOD]`). Never write prices, metrics or testimonials.
- **Legal pages are drafts** until counsel sets `reviewedByCounsel: true`, which removes the notice.
- **CMS config and content schemas change together** (`tests/cms-config.test.ts`).
- **A changed or removed URL gets a 301 in `firebase.json`.**
- **Motion respects `prefers-reduced-motion`.**

## Demo agent

`PUBLIC_DEMO_AGENT_TOKEN` (build-time repository variable) is the embed token of the agent the hero demo
talks to. Create it in the app with embed mode **headless** and `lightmove.ai` allowed. Without it the
button explains the demo isn't connected yet.
