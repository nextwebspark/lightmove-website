import { describe, expect, it } from 'vitest';
import { readingMinutes, selectPublished, tagSlug } from './blog-select';

const post = (id: string, pubDate: string, draft = false) => ({
  id,
  data: { pubDate: new Date(pubDate), draft },
});

describe('selectPublished', () => {
  const posts = [
    post('old', '2026-01-01'),
    post('draft', '2026-12-01', true),
    post('new', '2026-06-01'),
  ];

  it('lists published posts newest first', () => {
    expect(selectPublished(posts, false).map((p) => p.id)).toEqual(['new', 'old']);
  });

  it('shows drafts only when asked (development)', () => {
    expect(selectPublished(posts, true).map((p) => p.id)).toEqual(['draft', 'new', 'old']);
  });
});

describe('blog helpers', () => {
  it('rounds reading time to whole minutes, never below one', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes('word '.repeat(660))).toBe(3);
  });

  it('turns tags into URL slugs', () => {
    expect(tagSlug('Guides')).toBe('guides');
    expect(tagSlug('VoIP & SIP')).toBe('voip-sip');
  });
});
