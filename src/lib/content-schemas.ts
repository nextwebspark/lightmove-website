import { z } from 'astro/zod';

export const BLOG_TAGS = ['Guides', 'Product', 'Telephony', 'Company'] as const;
export type BlogTag = (typeof BLOG_TAGS)[number];

/** `author` is injected so the schema can be unit-tested without Astro's `reference()`. */
export function blogSchema<Author extends z.ZodType>({ author }: { author: Author }) {
  return z.object({
    title: z.string().max(90),
    description: z.string().min(50).max(160),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tag: z.enum(BLOG_TAGS),
    author,
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  });
}

export function authorSchema() {
  return z.object({
    name: z.string(),
    role: z.string(),
    initials: z.string().max(3),
  });
}

export function legalSchema() {
  return z.object({
    title: z.string(),
    description: z.string().min(50).max(160),
    updated: z.coerce.date(),
    // Drafts show a "pending legal review" notice until counsel signs off.
    reviewedByCounsel: z.boolean().default(false),
  });
}
