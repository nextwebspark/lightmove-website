import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import satori from 'satori';
import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCard {
  readonly title: string;
  readonly description: string;
  readonly section: string;
}

const require = createRequire(import.meta.url);

let fonts: Promise<{ display: Buffer; regular: Buffer; medium: Buffer }> | undefined;

function loadFonts() {
  // Satori reads TTF/OTF/WOFF but not WOFF2, so the static @fontsource .woff files are used here.
  const file = (path: string) => readFile(require.resolve(`@fontsource/${path}`));
  fonts ??= Promise.all([
    file('sora/files/sora-latin-600-normal.woff'),
    file('dm-sans/files/dm-sans-latin-400-normal.woff'),
    file('dm-sans/files/dm-sans-latin-500-normal.woff'),
  ]).then(([display, regular, medium]) => ({ display, regular, medium }));
  return fonts;
}

const MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#169B62"/><rect x="14" y="26" width="6" height="12" rx="3" fill="#fff"/><rect x="24" y="19" width="6" height="26" rx="3" fill="#fff"/><rect x="34" y="13" width="6" height="38" rx="3" fill="#fff"/><rect x="44" y="24" width="6" height="16" rx="3" fill="#fff"/><circle cx="47" cy="16.5" r="3.5" fill="#FF883E"/></svg>';
const markDataUri = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

export function titleFontSize(title: string): number {
  if (title.length > 64) return 54;
  if (title.length > 40) return 64;
  return 76;
}

type Node = { type: string; props: Record<string, unknown> };

const el = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra: Record<string, unknown> = {},
): Node => ({ type, props: { style, children, ...extra } });

const WAVE = [90, 170, 250, 140, 70];

/** Renders a page's share card: the dark theme, a mint glow and the voice bars. */
export async function renderOgImage(card: OgCard): Promise<Buffer> {
  const { display, regular, medium } = await loadFonts();

  const tree = el(
    'div',
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: 'flex',
      position: 'relative',
      backgroundColor: '#0b0d11',
      backgroundImage:
        'radial-gradient(circle at 92% 18%, rgba(61,220,151,0.30), rgba(11,13,17,0) 48%)',
      fontFamily: 'DM Sans',
      color: '#f4f6f8',
    },
    [
      el(
        'div',
        {
          position: 'absolute',
          right: 84,
          bottom: 0,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 18,
          opacity: 0.22,
        },
        WAVE.map((height) =>
          el('div', { width: 26, height, borderRadius: 13, backgroundColor: '#3ddc97' }),
        ),
      ),
      el(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          padding: '76px 84px 72px',
        },
        [
          el('div', { display: 'flex', alignItems: 'center', gap: 18 }, [
            el('img', { width: 56, height: 56 }, undefined, {
              src: markDataUri,
              width: 56,
              height: 56,
            }),
            el(
              'div',
              { display: 'flex', fontFamily: 'Sora', fontSize: 34, letterSpacing: '-0.03em' },
              [
                el('span', { color: '#f4f6f8' }, 'LightMove'),
                el('span', { color: '#3ddc97' }, '.ai'),
              ],
            ),
          ]),
          el('div', { display: 'flex', flexDirection: 'column', gap: 24 }, [
            el(
              'div',
              {
                fontFamily: 'Sora',
                fontSize: titleFontSize(card.title),
                lineHeight: 1.06,
                letterSpacing: '-0.04em',
                maxWidth: 940,
              },
              card.title,
            ),
            el(
              'div',
              { fontSize: 27, lineHeight: 1.45, color: '#a3acb9', maxWidth: 900 },
              card.description,
            ),
          ]),
          el('div', { display: 'flex', alignItems: 'center', gap: 16 }, [
            el('div', { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff883e' }),
            el(
              'div',
              { fontSize: 19, fontWeight: 500, letterSpacing: '0.16em', color: '#3ddc97' },
              `LIGHTMOVE.AI · ${card.section.toUpperCase()}`,
            ),
          ]),
        ],
      ),
    ],
  );

  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: 'Sora', data: display, weight: 600, style: 'normal' },
      { name: 'DM Sans', data: regular, weight: 400, style: 'normal' },
      { name: 'DM Sans', data: medium, weight: 500, style: 'normal' },
    ],
  });

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
