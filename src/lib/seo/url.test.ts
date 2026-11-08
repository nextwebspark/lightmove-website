import { describe, expect, it } from 'vitest';
import { absoluteUrl, ogImagePathFor } from './url';

describe('absoluteUrl', () => {
  it.each([
    ['/', 'https://lightmove.ai/'],
    ['/blog/', 'https://lightmove.ai/blog'],
    ['/blog.html', 'https://lightmove.ai/blog'],
    ['/index.html', 'https://lightmove.ai/'],
    ['/blog/tag/guides/index.html', 'https://lightmove.ai/blog/tag/guides'],
    ['/privacy?utm=x#top', 'https://lightmove.ai/privacy'],
  ])('turns %s into the one canonical address %s', (input, expected) => {
    expect(absoluteUrl(input)).toBe(expected);
  });
});

describe('ogImagePathFor', () => {
  it.each([
    ['/', '/og/index.png'],
    ['/blog', '/og/blog.png'],
    ['/blog/my-post/', '/og/blog/my-post.png'],
    ['/go-live/web-widget.html', '/og/go-live/web-widget.png'],
  ])('puts the share card for %s at %s', (input, expected) => {
    expect(ogImagePathFor(input)).toBe(expected);
  });
});
