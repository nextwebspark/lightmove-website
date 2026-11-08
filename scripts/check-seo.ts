import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  HOSTING_TARGETS,
  loadHostingConfig,
  SITE_ORIGINS,
  type HostingTarget,
} from './lib/firebase-headers.ts';

/**
 * Post-build audit of what search engines actually receive, for both sites: every indexable page has
 * exactly one <h1>, a <title> of 60 characters or fewer, a 50–160 character description, a canonical
 * on its own origin (https://lightmove.ai or https://docs.lightmove.ai) that matches its own URL, an
 * og:image on that origin that exists in its dist, and valid JSON-LD. Titles and descriptions must
 * also be unique across each site.
 */

/** Files each site must serve besides its pages. */
const REQUIRED: Record<HostingTarget, readonly string[]> = {
  website: ['robots.txt', 'sitemap-index.xml', 'llms.txt', 'blog/rss.xml', 'site.webmanifest'],
  docs: ['robots.txt', 'sitemap-index.xml', 'llms.txt', 'site.webmanifest', '404.html'],
};

const problems: string[] = [];
let pagesChecked = 0;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'admin' ? [] : htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

const decode = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const meta = (html: string, attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`).exec(html)?.[1];

for (const target of HOSTING_TARGETS) {
  const DIST = loadHostingConfig(target).public;
  const ORIGIN = SITE_ORIGINS[target];
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  if (!existsSync(DIST)) {
    problems.push(`${DIST} is missing; build the ${target} site first.`);
    continue;
  }

  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf8');
    if (html.includes('http-equiv="refresh"')) continue;

    const route =
      `/${relative(DIST, file).split(sep).join('/')}`.replace(/(\/index)?\.html$/, '') || '/';
    const robots = meta(html, 'name', 'robots') ?? 'index,follow';
    if (robots.startsWith('noindex')) continue;
    pagesChecked += 1;
    const fail = (message: string) => problems.push(`${target}:${route}: ${message}`);

    const h1s = html.match(/<h1\b/g)?.length ?? 0;
    if (h1s !== 1) fail(`has ${h1s} <h1> elements; needs exactly one.`);

    const title = decode(/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '');
    if (!title) fail('has no <title>.');
    else if (title.length > 60) fail(`title is ${title.length} characters: "${title}".`);

    const description = decode(meta(html, 'name', 'description') ?? '');
    if (description.length < 50 || description.length > 160) {
      fail(`description is ${description.length} characters; keep it between 50 and 160.`);
    }

    const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    const expected = `${ORIGIN}${route === '/' ? '/' : route}`;
    if (canonical !== expected)
      fail(`canonical is ${canonical ?? 'missing'}, expected ${expected}.`);

    const image = meta(html, 'property', 'og:image');
    if (!image?.startsWith(`${ORIGIN}/`)) fail(`og:image is ${image ?? 'missing'}.`);
    else if (!existsSync(join(DIST, new URL(image).pathname)))
      fail(`og:image ${image} is not in dist.`);

    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    )) {
      try {
        JSON.parse(json ?? '');
      } catch {
        fail('has JSON-LD that does not parse.');
      }
    }

    for (const [seen, value] of [
      [titles, title],
      [descriptions, description],
    ] as const) {
      const other = seen.get(value);
      if (other) fail(`shares its ${seen === titles ? 'title' : 'description'} with ${other}.`);
      else seen.set(value, route);
    }
  }

  for (const required of REQUIRED[target]) {
    if (!existsSync(join(DIST, required))) problems.push(`${DIST}/${required} is missing.`);
  }
}

if (problems.length > 0) {
  console.error(`SEO audit failed (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

console.warn(`SEO audit passed for ${pagesChecked} indexable pages.`);
