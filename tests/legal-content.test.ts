import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SITE } from '../src/lib/site';

// The legal pages repeat the CRO details by hand; keep them in step with SITE.legal.
describe.each(['privacy', 'terms'])('src/content/legal/%s.md', (page) => {
  const text = readFileSync(`src/content/legal/${page}.md`, 'utf8');

  it('names the company, number and registered office from SITE.legal', () => {
    expect(text).toContain(SITE.legal.entity);
    expect(text).toContain(`company number ${SITE.legal.companyNumber}`);
    expect(text).toContain(SITE.legal.registeredOffice);
  });

  it('uses the registered business name', () => {
    expect(text).toContain(SITE.legal.tradingName);
    expect(text).not.toContain('LightMove.ai');
  });
});
