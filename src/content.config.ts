import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const BLOG_TAGS = ['Guides', 'Product', 'Telephony', 'Company'] as const;

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string().max(90),
    description: z.string().min(50).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tag: z.enum(BLOG_TAGS),
    author: reference('authors'),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const authors = defineCollection({
  loader: glob({ base: './src/content/authors', pattern: '**/*.json' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    initials: z.string().max(3),
  }),
});

const legal = defineCollection({
  loader: glob({ base: './src/content/legal', pattern: '*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string().min(50).max(160),
    updated: z.coerce.date(),
    // Drafts show a "pending legal review" notice until counsel signs off.
    reviewedByCounsel: z.boolean().default(false),
  }),
});

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema(),
});

export const collections = { blog, authors, legal, docs };
