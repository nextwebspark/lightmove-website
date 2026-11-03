import { describe, expect, it } from 'vitest';
import {
  CONSENT_MAX_AGE_DAYS,
  CONSENT_VERSION,
  OPTIONAL_CATEGORIES,
  STORAGE_ITEMS,
  consentRequired,
  makeConsent,
  needsBanner,
  parseConsent,
  withdrew,
  type ConsentCategory,
} from './consent';

const analytics: ConsentCategory = {
  id: 'analytics',
  label: 'Analytics',
  description: 'd',
  inUse: true,
};
const marketing: ConsentCategory = {
  id: 'marketing',
  label: 'Marketing',
  description: 'd',
  inUse: true,
};
const categories = [analytics, marketing];
const now = new Date('2026-11-01T12:00:00Z');

describe('the site today', () => {
  it('asks about the planned analytics and error monitoring, and says neither runs yet', () => {
    expect(OPTIONAL_CATEGORIES.map((category) => category.id)).toEqual(['analytics', 'errors']);
    expect(OPTIONAL_CATEGORIES.every((category) => !category.inUse)).toBe(true);
    expect(consentRequired).toBe(true);
    expect(needsBanner(OPTIONAL_CATEGORIES, null)).toBe(true);
  });

  it('sets nothing optional yet: every storage item is strictly necessary', () => {
    // Switching a tool on means listing its storage here under its category, setting inUse and
    // bumping CONSENT_VERSION so everyone is asked again.
    expect(STORAGE_ITEMS.every((item) => item.category === 'necessary')).toBe(true);
  });

  it('lists only necessary storage on /cookies, and nothing for an optional category that does not exist', () => {
    const ids = new Set(OPTIONAL_CATEGORIES.map((category) => category.id));
    for (const item of STORAGE_ITEMS) {
      expect(item.category === 'necessary' || ids.has(item.category)).toBe(true);
    }
  });
});

describe('consent once optional categories exist', () => {
  it('shows the banner until the visitor chooses', () => {
    expect(needsBanner(categories, null)).toBe(true);
    expect(needsBanner(categories, makeConsent([], categories, now))).toBe(false);
  });

  it('refuses everything not explicitly granted (Reject all stores all false)', () => {
    expect(makeConsent([], categories, now).choices).toEqual({
      analytics: false,
      marketing: false,
    });
    expect(makeConsent(['analytics'], categories, now).choices).toEqual({
      analytics: true,
      marketing: false,
    });
  });

  it('round-trips a stored choice', () => {
    const stored = makeConsent(['marketing'], categories, now);
    expect(parseConsent(JSON.stringify(stored), categories, now)).toEqual(stored);
  });

  it.each([
    ['missing', null],
    ['not JSON', '{oops'],
    [
      'wrong version',
      JSON.stringify({ v: CONSENT_VERSION + 1, at: now.toISOString(), choices: {} }),
    ],
    ['bad date', JSON.stringify({ v: CONSENT_VERSION, at: 'yesterday', choices: {} })],
  ])('asks again when the stored value is %s', (_label, raw) => {
    expect(parseConsent(raw, categories, now)).toBeNull();
  });

  it('asks again after the maximum age', () => {
    const old = makeConsent(['analytics'], categories, new Date('2026-01-01T00:00:00Z'));
    const later = new Date(Date.parse(old.at) + (CONSENT_MAX_AGE_DAYS + 1) * 86_400_000);
    expect(parseConsent(JSON.stringify(old), categories, later)).toBeNull();
  });

  it('asks again when a new category has been added since the visitor chose', () => {
    const before = makeConsent(['analytics'], [analytics], now);
    expect(parseConsent(JSON.stringify(before), categories, now)).toBeNull();
  });

  it('detects withdrawal so already-loaded scripts can be stopped', () => {
    const granted = makeConsent(['analytics'], categories, now);
    expect(withdrew(granted, makeConsent([], categories, now))).toBe(true);
    expect(withdrew(granted, makeConsent(['analytics', 'marketing'], categories, now))).toBe(false);
    expect(withdrew(null, granted)).toBe(false);
  });
});
