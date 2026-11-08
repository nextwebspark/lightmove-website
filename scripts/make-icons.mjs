// Renders the PNG icons in public/ and docs-site/public/ from the brand mark. Re-run only when the
// mark changes:
//   node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const mark = readFileSync(new URL('../src/assets/mark.svg', import.meta.url));
const PUBLIC_DIRS = ['public', 'docs-site/public'];
const out = (dir, name) => new URL(`../${dir}/${name}`, import.meta.url).pathname;

for (const [name, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  const png = await sharp(mark, { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  for (const dir of PUBLIC_DIRS) {
    await sharp(png).toFile(out(dir, name));
    console.warn(`wrote ${dir}/${name}`);
  }
}
