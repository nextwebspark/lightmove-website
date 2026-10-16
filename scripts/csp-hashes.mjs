// Prints the sha256 CSP source for every distinct inline <script> in dist/, grouped by section.
// Site pages must have none (scripts ship as files); Starlight's docs pages carry a few fixed ones,
// whose hashes belong in the /docs/** CSP in firebase.json. Run after `npm run build`.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const inline = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* htmlFiles(path);
    else if (name.endsWith('.html')) yield path;
  }
}

const sections = { site: new Map(), docs: new Map() };
for (const file of htmlFiles(dist)) {
  const rel = relative(dist, file);
  const section = rel.startsWith('docs/') ? 'docs' : 'site';
  for (const [, body] of readFileSync(file, 'utf8').matchAll(inline)) {
    if (!body.trim()) continue;
    const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`;
    if (!sections[section].has(hash)) sections[section].set(hash, rel);
  }
}

for (const [section, hashes] of Object.entries(sections)) {
  console.log(`${section}: ${hashes.size} inline script(s)`);
  for (const [hash, file] of hashes) console.log(`  ${hash}  (first seen in ${file})`);
}

if (sections.site.size > 0) {
  console.error('Site pages must not contain inline scripts.');
  process.exit(1);
}
