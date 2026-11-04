/**
 * Cookie consent: which optional categories exist, and the visitor's stored choice.
 *
 * Analytics and error monitoring are planned but nothing optional runs yet: both categories are
 * `inUse: false`, and the banner and /cookies say so. Asking now records each visitor's choice ahead
 * of time; it is not consent to a tool nobody has named. To switch a tool on:
 *   1. name the provider, what it collects and where, in content/legal/cookies.md (and Privacy),
 *   2. list each cookie or storage item it sets in STORAGE_ITEMS (shown on /cookies),
 *   3. load it only after `hasConsent(category)` is true, and listen for `CONSENT_EVENT`,
 *   4. render the banner on docs pages too (DocsHead) if the tool runs there,
 *   5. set its category's `inUse: true` and bump CONSENT_VERSION, so everyone is asked again with
 *      the real details. Do the same whenever a category is added or changes.
 * S.I. 336/2011 Reg. 5 requires consent before; the DPC guidance asks for Reject as easy as Accept.
 * EDPB Guidelines 2/2023 bring "cookieless" tracking (pixels, fingerprinting, scripts that send
 * device data) under the same rule, so a tool that sets no cookie still goes in a category.
 */

export interface ConsentCategory {
  id: string;
  label: string;
  description: string;
  /** False until a tool in this category actually runs. The banner and dialog then say so. */
  inUse: boolean;
}

export const OPTIONAL_CATEGORIES: readonly ConsentCategory[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Counts visits and which pages are read, so we can improve the site.',
    inUse: false,
  },
  {
    id: 'errors',
    label: 'Error monitoring',
    description:
      'Reports errors in your browser, such as a page that fails to load, with technical details about the error and your browser.',
    inUse: false,
  },
];

export const consentRequired = OPTIONAL_CATEGORIES.length > 0;

export const CONSENT_STORAGE_KEY = 'lm-consent';
export const CONSENT_VERSION = 1;
/** How long a choice is remembered before the visitor is asked again. */
export const CONSENT_MAX_AGE_DAYS = 180;
/** Fired on window with the new StoredConsent as `detail` whenever the visitor saves a choice. */
export const CONSENT_EVENT = 'lm:consent';

export interface StoredConsent {
  v: number;
  /** ISO time the choice was made. */
  at: string;
  choices: Record<string, boolean>;
}

/** Every cookie or storage item the site or its embeds can set, for the /cookies page. */
export interface StorageItem {
  name: string;
  kind: 'Cookie' | 'Local storage';
  setBy: string;
  purpose: string;
  duration: string;
  /** 'necessary' items need no consent (Reg. 5(5)); anything else is an OPTIONAL_CATEGORIES id. */
  category: 'necessary' | string;
}

export const STORAGE_ITEMS: readonly StorageItem[] = [
  {
    name: 'starlight-theme',
    kind: 'Local storage',
    setBy: 'lightmove.ai',
    purpose:
      'Remembers the light or dark theme you picked. Only set when you use the theme switch.',
    duration: 'Until you clear it',
    category: 'necessary',
  },
  {
    name: CONSENT_STORAGE_KEY,
    kind: 'Local storage',
    setBy: 'lightmove.ai',
    purpose: 'Remembers your cookie choices: which optional categories you allowed, and when.',
    duration: `${CONSENT_MAX_AGE_DAYS} days`,
    category: 'necessary',
  },
];

/** Reads a stored choice. Returns null when it is missing, malformed, out of date or expired. */
export function parseConsent(
  raw: string | null,
  categories: readonly ConsentCategory[],
  now: Date,
): StoredConsent | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const { v, at, choices } = parsed as Partial<StoredConsent>;
  if (v !== CONSENT_VERSION || typeof at !== 'string' || !choices || typeof choices !== 'object')
    return null;
  const madeAt = Date.parse(at);
  if (Number.isNaN(madeAt)) return null;
  if (now.getTime() - madeAt > CONSENT_MAX_AGE_DAYS * 86_400_000) return null;
  // A category added since the visitor chose means they haven't answered for it yet.
  if (categories.some((category) => typeof choices[category.id] !== 'boolean')) return null;
  return { v, at, choices: choices as Record<string, boolean> };
}

/** Builds a choice to store. Anything not explicitly granted is refused. */
export function makeConsent(
  granted: Iterable<string>,
  categories: readonly ConsentCategory[],
  now: Date,
): StoredConsent {
  const yes = new Set(granted);
  return {
    v: CONSENT_VERSION,
    at: now.toISOString(),
    choices: Object.fromEntries(categories.map((category) => [category.id, yes.has(category.id)])),
  };
}

export function needsBanner(
  categories: readonly ConsentCategory[],
  stored: StoredConsent | null,
): boolean {
  return categories.length > 0 && stored === null;
}

/** True when consent for this category was withdrawn, so scripts already running must be unloaded. */
export function withdrew(before: StoredConsent | null, after: StoredConsent): boolean {
  if (!before) return false;
  return Object.entries(before.choices).some(([id, granted]) => granted && !after.choices[id]);
}

/** For scripts that need consent: call in the browser before loading anything optional. */
export function hasConsent(category: string): boolean {
  try {
    const stored = parseConsent(
      localStorage.getItem(CONSENT_STORAGE_KEY),
      OPTIONAL_CATEGORIES,
      new Date(),
    );
    return stored?.choices[category] === true;
  } catch {
    return false;
  }
}
