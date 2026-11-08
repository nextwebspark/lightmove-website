import { readFileSync } from 'node:fs';

export interface HeaderRule {
  readonly source: string;
  readonly headers: readonly { readonly key: string; readonly value: string }[];
}

export interface HostingConfig {
  readonly target: HostingTarget;
  readonly public: string;
  readonly cleanUrls: boolean;
  readonly trailingSlash: boolean;
  readonly headers: readonly HeaderRule[];
  readonly redirects: readonly { source: string; destination: string; type: number }[];
  readonly rewrites?: readonly {
    source: string;
    function?: { functionId: string; region: string };
  }[];
}

/** The two Hosting targets (.firebaserc): lightmove.ai and docs.lightmove.ai. */
export const HOSTING_TARGETS = ['website', 'docs'] as const;
export type HostingTarget = (typeof HOSTING_TARGETS)[number];

/** The address each site is canonical on. */
export const SITE_ORIGINS: Record<HostingTarget, string> = {
  website: 'https://lightmove.ai',
  docs: 'https://docs.lightmove.ai',
};

export function loadHostingConfig(
  target: HostingTarget = 'website',
  file = 'firebase.json',
): HostingConfig {
  const { hosting } = JSON.parse(readFileSync(file, 'utf8')) as { hosting: HostingConfig[] };
  const config = hosting.find((entry) => entry.target === target);
  if (!config) throw new Error(`${file} has no hosting entry with target "${target}".`);
  return config;
}

/** Firebase header globs: `**` crosses slashes, `*` does not, `{a,b}` alternates; sources are rooted at `/`. */
export function globToRegExp(glob: string): RegExp {
  const rooted = glob.startsWith('/') ? glob : `/${glob}`;
  let pattern = '';
  for (let index = 0; index < rooted.length; index += 1) {
    const char = rooted[index];
    if (char === '*' && rooted[index + 1] === '*') {
      pattern += '.*';
      index += 1;
    } else if (char === '*') {
      pattern += '[^/]*';
    } else if (char === '{') {
      pattern += '(?:';
    } else if (char === '}') {
      pattern += ')';
    } else if (char === ',') {
      pattern += '|';
    } else {
      pattern += (char ?? '').replace(/[.+?^$()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${pattern}$`);
}

/**
 * Every matching rule applies in file order and a later rule's value replaces an earlier one for the
 * same header, the way Firebase Hosting does it. A path-specific rule only wins after the `**` rule.
 */
export function effectiveHeaders(rules: readonly HeaderRule[], path: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const rule of rules) {
    if (!globToRegExp(rule.source).test(path)) continue;
    for (const header of rule.headers) {
      result.set(header.key.toLowerCase(), header.value);
    }
  }
  return result;
}

export function parseCsp(policy: string | undefined): Map<string, string[]> {
  const directives = new Map<string, string[]>();
  for (const part of (policy ?? '').split(';')) {
    const [name, ...values] = part.trim().split(/\s+/);
    if (name) directives.set(name.toLowerCase(), values);
  }
  return directives;
}
