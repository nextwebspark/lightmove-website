import { getCollection, type CollectionEntry } from 'astro:content';
import { selectPublished } from './blog-select';

export type Post = CollectionEntry<'blog'>;

export async function getPublishedPosts(): Promise<Post[]> {
  return selectPublished(await getCollection('blog'), import.meta.env.DEV);
}

export { formatDate, readingMinutes, tagSlug } from './blog-select';
