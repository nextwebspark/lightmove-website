import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgImage } from '../../../../src/lib/og/render';

/** One share card per docs page, at the path `ogImagePathFor()` gives that page. */
export const getStaticPaths = (async () =>
  (await getCollection('docs')).map((doc) => ({
    params: { slug: doc.id },
    props: { title: doc.data.title, description: doc.data.description ?? '', section: 'Docs' },
  }))) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage(props);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
