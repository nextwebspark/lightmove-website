import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { effectiveHeaders, loadHostingConfig, parseCsp } from './lib/firebase-headers.ts';

/**
 * Post-build audit: every page in dist must run under the Content-Security-Policy firebase.json will
 * serve it with. A Starlight upgrade that changes an inline script, or a script tag pointing at an
 * unlisted origin, fails here instead of in production. The failure prints the hash to allow.
 */

const hosting = loadHostingConfig();
const distDir = hosting.public;
const problems: string[] = [];
let pagesChecked = 0;

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'admin' ? [] : htmlFiles(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

function routeFor(file: string): string {
  const path = `/${relative(distDir, file).split(sep).join('/')}`.replace(/\.html$/, '');
  return path.replace(/\/index$/, '') || '/';
}

for (const file of htmlFiles(distDir)) {
  // Expressive Code keeps each code block's raw text in data-code for its copy button; a <script>
  // example in the docs would otherwise read as a real script tag.
  const html = readFileSync(file, 'utf8').replace(/\sdata-code="[^"]*"/g, '');
  if (html.includes('http-equiv="refresh"')) continue;
  pagesChecked += 1;

  const route = routeFor(file);
  const csp = parseCsp(effectiveHeaders(hosting.headers, route).get('content-security-policy'));
  const scriptSrc = csp.get('script-src') ?? csp.get('default-src') ?? [];
  const styleSrc = csp.get('style-src') ?? csp.get('default-src') ?? [];
  const formAction = csp.get('form-action') ?? [];

  if (csp.size === 0) problems.push(`${route}: no Content-Security-Policy header applies.`);

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    const src = /\bsrc="([^"]+)"/.exec(attributes)?.[1];
    if (src) {
      if (!src.startsWith('/') && !scriptSrc.includes(new URL(src).origin)) {
        problems.push(`${route}: script ${src} is not allowed by script-src.`);
      }
      continue;
    }
    if (/type="application\/(ld\+)?json"/.test(attributes)) continue;
    const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
    if (!scriptSrc.includes(hash)) {
      problems.push(
        `${route}: inline script ${hash} is not allowed by script-src. Starts: ${body.trim().slice(0, 60)}`,
      );
    }
  }

  const hasInlineStyle = /<style\b/.test(html) || /\sstyle="/.test(html);
  if (hasInlineStyle && !styleSrc.includes("'unsafe-inline'")) {
    problems.push(`${route}: has a <style> element or style attribute, which style-src blocks.`);
  }

  for (const match of html.matchAll(/<form\b[^>]*\baction="(https?:[^"]+)"/g)) {
    const origin = new URL(match[1] ?? '').origin;
    if (!formAction.includes(origin)) {
      problems.push(`${route}: form posts to ${origin}; add it to form-action in firebase.json.`);
    }
  }
}

if (problems.length > 0) {
  console.error(`CSP audit failed (${problems.length}):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

console.warn(`CSP audit passed for ${pagesChecked} pages.`);
