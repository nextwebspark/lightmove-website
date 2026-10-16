import { describe, expect, it } from 'vitest';
import { auditMeta, composeTitle, robotsFor, TITLE_MAX } from './meta';

describe('composeTitle', () => {
  it('gives the home page the brand and tagline', () => {
    expect(composeTitle(undefined)).toBe('LightMove.ai — AI voice agents for business');
    expect(composeTitle('LightMove.ai')).toBe('LightMove.ai — AI voice agents for business');
  });

  it('appends the brand when it fits', () => {
    expect(composeTitle('Blog')).toBe('Blog — LightMove.ai');
  });

  it('drops the brand rather than run past what search results show', () => {
    const long = 'How to connect your existing business phone number with SIP';
    expect(composeTitle(long)).toBe(long);
    expect(composeTitle(long).length).toBeLessThanOrEqual(TITLE_MAX);
  });
});

describe('robotsFor', () => {
  it('indexes by default, follows on noindex pages, and hides drafts entirely', () => {
    expect(robotsFor({})).toBe('index,follow');
    expect(robotsFor({ noindex: true })).toBe('noindex,follow');
    expect(robotsFor({ draft: true })).toBe('noindex,nofollow');
  });
});

describe('auditMeta', () => {
  it('flags descriptions outside the 50–160 character budget', () => {
    expect(auditMeta({ title: 'Blog', description: 'Too short.' })).toHaveLength(1);
    expect(auditMeta({ title: 'Blog', description: 'x'.repeat(161) })).toHaveLength(1);
    expect(auditMeta({ title: 'Blog', description: 'x'.repeat(120) })).toEqual([]);
  });
});
