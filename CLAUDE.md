# LightMove.ai website

The public site for **LightMove.ai** — voice AI agents — at `https://lightmove.ai`: marketing pages, the
blog, the docs and the legal pages. The product is a separate codebase (`nextwebspark/failte-ai`) running
at `https://app.lightmove.ai`; this site only links to it and loads its embeddable voice widget for the
home page demo. Static Astro build, meant for Firebase Hosting, blog editable through Sveltia CMS at
`/admin`. The setup follows `nextwebspark/uncava-website`.

## Commands

```bash
npm run dev       # local dev server (http://localhost:4321)
npm run build     # static build into dist/
npm run preview   # serve dist/ locally
npm run check     # astro check (types, content schemas)
npm run verify    # check + build
node scripts/csp-hashes.mjs   # after a build: fails if a site page has an inline script; prints docs hashes
```

## Layout

| Path                         | What                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------- |
| `design/*.dc.html`           | **Source of truth for the UI** (exported from the design canvas). Read before changing UI. |
| `src/pages/`                 | Routes: home, `blog/` (index, post, tag, RSS), `privacy`, `terms`, `404`.                |
| `src/components/{site,home,blog,docs}` | Astro components grouped by where they are used.                              |
| `src/layouts/`               | `BaseLayout` (every non-docs page) and `LegalLayout`.                                    |
| `src/content/`               | `blog/*.md`, `authors/*.json`, `legal/*.md`, `docs/docs/**/*.md` (Starlight, at `/docs`). |
| `src/styles/`                | `tokens.css` (colours, light + dark, shared with docs), `global.css`, `docs.css`.        |
| `src/lib/`                   | Site constants (`site.ts`), blog helpers, use-case data.                                 |
| `public/theme-init.js`       | Sets `<html data-theme>` before paint. Shares the `starlight-theme` key with the docs.   |
| `public/admin/`              | Sveltia CMS. `config.yml` mirrors `src/content.config.ts`.                               |

## Invariants

- **Brand:** colours and type come from `src/styles/tokens.css` (the LightMove brand kit in
  `failte-ai/brand-kit/lightmove-brand/`). Light theme is the brand kit; dark theme is the app's charcoal
  (`#0B0D11` / `#14181F` / `#1C212A`) with mint `#3DDC97` as the only accent. Spark orange is for the
  live dot and small accents only, never text.
- **No inline scripts on site pages.** Component `<script>`s are bundled to files; `theme-init.js` is a
  public file. The CSP in `firebase.json` is self-only plus `app.lightmove.ai` for the widget. Docs pages
  allow Starlight's fixed inline scripts by hash; re-run `scripts/csp-hashes.mjs` after a Starlight upgrade.
- **Inline `style` attributes are allowed** (`style-src 'unsafe-inline'`); keep them for per-element values
  (sizes, delays), put everything else in component `<style>`.
- **`global.css` sits in `@layer site`** so a component's scoped styles always override it.
- **No invented facts.** Product claims must match what the app does. Unknowns are visible bracketed
  placeholders (`[€X]`, `[RETENTION PERIOD]`). Never write prices, metrics or testimonials.
- **Legal pages are drafts** until counsel sets `reviewedByCounsel: true`, which removes the notice.
- **CMS config and content schemas change together.**
- **Motion respects `prefers-reduced-motion`.**

## Demo agent

`PUBLIC_DEMO_AGENT_TOKEN` (build-time env) is the embed token of the agent the hero demo talks to. Create
it in the app with embed mode **headless** and `lightmove.ai` allowed. Without it the button explains the
demo isn't connected yet.
