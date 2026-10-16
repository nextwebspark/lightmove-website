import { SITE } from '../site';

export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 50;
export const DESCRIPTION_MAX = 160;

/** Appends the brand unless doing so would push the title past what search results display. */
export function composeTitle(pageTitle: string | undefined): string {
  if (!pageTitle || pageTitle === SITE.name) {
    return `${SITE.name} — ${SITE.tagline}`;
  }
  const branded = `${pageTitle} — ${SITE.name}`;
  return branded.length <= TITLE_MAX ? branded : pageTitle;
}

export type RobotsDirective = 'index,follow' | 'noindex,follow' | 'noindex,nofollow';

export function robotsFor(options: {
  noindex?: boolean | undefined;
  draft?: boolean | undefined;
}): RobotsDirective {
  if (options.draft) return 'noindex,nofollow';
  return options.noindex ? 'noindex,follow' : 'index,follow';
}

export interface MetaProblem {
  readonly field: 'title' | 'description';
  readonly message: string;
}

export function auditMeta(meta: { title: string; description: string }): MetaProblem[] {
  const problems: MetaProblem[] = [];
  const fullTitle = composeTitle(meta.title);
  if (fullTitle.length > TITLE_MAX) {
    problems.push({
      field: 'title',
      message: `"${fullTitle}" is ${fullTitle.length} characters; keep it within ${TITLE_MAX}.`,
    });
  }
  if (meta.description.length < DESCRIPTION_MIN || meta.description.length > DESCRIPTION_MAX) {
    problems.push({
      field: 'description',
      message: `Description is ${meta.description.length} characters; keep it between ${DESCRIPTION_MIN} and ${DESCRIPTION_MAX}.`,
    });
  }
  return problems;
}
