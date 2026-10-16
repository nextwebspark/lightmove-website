import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { getPublishedPosts, tagSlug } from '../../lib/blog';
import { tagDescription } from '../../lib/blog-select';
import { BLOG_TAGS } from '../../lib/content-schemas';
import { renderOgImage } from '../../lib/og/render';
import { staticPages } from '../../lib/pages';

/** One share card per indexable page, at the path `ogImagePathFor()` gives that page. */
export const getStaticPaths = (async () => {
  const pages = Object.values(staticPages).map((page) => ({
    params: { slug: page.path === '/' ? 'index' : page.path.slice(1) },
    props: {
      title: page.ogTitle,
      description: page.description,
      section: page.path === '/' ? 'Home' : page.title,
    },
  }));

  const posts = await getPublishedPosts();
  const postCards = posts.map((post) => ({
    params: { slug: `blog/${post.id}` },
    props: { title: post.data.title, description: post.data.description, section: 'Blog' },
  }));

  const tagCards = BLOG_TAGS.filter((tag) => posts.some((post) => post.data.tag === tag)).map(
    (tag) => ({
      params: { slug: `blog/tag/${tagSlug(tag)}` },
      props: { title: tag, description: tagDescription(tag), section: 'Blog' },
    }),
  );

  const legalCards = (await getCollection('legal')).map((entry) => ({
    params: { slug: entry.id },
    props: { title: entry.data.title, description: entry.data.description, section: 'Legal' },
  }));

  const docCards = (await getCollection('docs')).map((doc) => ({
    params: { slug: doc.id },
    props: { title: doc.data.title, description: doc.data.description ?? '', section: 'Docs' },
  }));

  return [...pages, ...postCards, ...tagCards, ...legalCards, ...docCards];
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage(props);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
