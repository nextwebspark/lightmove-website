import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts } from '../lib/blog';
import { FAQS } from '../lib/faqs';
import { staticPages } from '../lib/pages';
import { absoluteUrl } from '../lib/seo/url';
import { APP, SITE } from '../lib/site';

/** A plain-text map of the site for AI assistants and answer engines (llmstxt.org). */
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const docs = (await getCollection('docs')).toSorted((a, b) => a.id.localeCompare(b.id));
  const legal = await getCollection('legal');
  const link = (title: string, path: string, description: string) =>
    `- [${title}](${absoluteUrl(path)}): ${description}`;

  const body = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} is a product of ${SITE.company}, based in ${SITE.location}. The application runs at ${APP.url}. This site is the public website, blog and documentation.`,
    '',
    '## Pages',
    link('Home', '/', staticPages.home.description),
    link(staticPages.blog.title, staticPages.blog.path, staticPages.blog.description),
    ...legal.map((entry) => link(entry.data.title, `/${entry.id}`, entry.data.description)),
    '',
    '## Docs',
    ...docs.map((doc) => link(doc.data.title, `/${doc.id}`, doc.data.description ?? '')),
    '',
    '## Blog',
    ...posts.map((post) => link(post.data.title, `/blog/${post.id}`, post.data.description)),
    '',
    '## FAQ',
    ...FAQS.flatMap(({ question, answer }) => [`### ${question}`, answer, '']),
  ].join('\n');

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
