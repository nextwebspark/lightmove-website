import { describe, expect, it } from 'vitest';
import { FAQS } from './faqs';
import { staticPages } from './pages';
import { auditMeta } from './seo/meta';

describe('static page metadata', () => {
  it.each(Object.entries(staticPages))('%s fits the title and description budgets', (_, page) => {
    expect(auditMeta(page)).toEqual([]);
  });

  it('gives every page a unique path, title and description', () => {
    const pages = Object.values(staticPages);

    for (const field of ['path', 'title', 'description'] as const) {
      expect(new Set(pages.map((page) => page[field])).size).toBe(pages.length);
    }
  });
});

describe('FAQ structured data', () => {
  it('publishes no unfilled placeholders', () => {
    for (const { question, answer } of FAQS) {
      expect(`${question} ${answer}`).not.toMatch(/\[[A-Z€]/);
    }
  });
});
