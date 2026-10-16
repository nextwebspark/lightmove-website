/** Pure blog helpers, kept free of `astro:content` so they can be unit-tested. */

interface Dated {
  readonly data: { readonly pubDate: Date; readonly draft: boolean };
}

/** Newest first; drafts only in development. */
export function selectPublished<T extends Dated>(posts: readonly T[], includeDrafts: boolean): T[] {
  return posts
    .filter((post) => includeDrafts || !post.data.draft)
    .toSorted((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function readingMinutes(markdown: string | undefined): number {
  const words = (markdown ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function tagSlug(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function tagDescription(tag: string): string {
  return `${tag} posts from the LightMove.ai blog: guides and notes on building AI voice agents for Irish businesses.`;
}
