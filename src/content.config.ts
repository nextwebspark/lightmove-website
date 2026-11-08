import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { authorSchema, blogSchema, legalSchema } from './lib/content-schemas';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: blogSchema({ author: reference('authors') }),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.json' }),
  schema: authorSchema(),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '*.md' }),
  schema: legalSchema(),
});

export const collections = { blog, authors, legal };
