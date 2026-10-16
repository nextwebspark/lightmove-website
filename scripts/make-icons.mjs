// Renders the PNG icons in public/ from the brand mark. Re-run only when the mark changes:
//   node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const mark = readFileSync(new URL('../src/assets/mark.svg', import.meta.url));
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname;

for (const [name, size] of [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
]) {
  await sharp(mark, { density: 72 * (size / 64) * 2 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out(name));
  console.warn(`wrote public/${name}`);
}
