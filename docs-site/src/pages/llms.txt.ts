import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { absoluteUrl } from '../../../src/lib/seo/url';
import { APP, SITE } from '../../../src/lib/site';
import { DOCS_SITE } from '../site';

/** A plain-text map of the docs for AI assistants and answer engines (llmstxt.org). */
export const GET: APIRoute = async () => {
  const docs = (await getCollection('docs')).toSorted((a, b) => a.id.localeCompare(b.id));
  const body = [
    `# ${DOCS_SITE.name}`,
    '',
    `> How to build, test and run voice agents on ${SITE.name}.`,
    '',
    `The documentation for ${SITE.name}, a product of ${SITE.company}. The application runs at ${APP.url}; the company website is ${SITE.url}.`,
    '',
    '## Docs',
    ...docs.map(
      (doc) =>
        `- [${doc.data.title}](${absoluteUrl(`/${doc.id}`, DOCS_SITE.url)}): ${doc.data.description ?? ''}`,
    ),
    '',
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
