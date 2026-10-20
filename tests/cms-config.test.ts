import { readFileSync, readdirSync } from 'node:fs';
import { z } from 'astro/zod';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { BLOG_TAGS, authorSchema, blogSchema, legalSchema } from '../src/lib/content-schemas';

interface CmsField {
  name: string;
  widget: string;
  required?: boolean;
  options?: string[];
}

interface CmsCollection {
  name: string;
  folder?: string;
  extension?: string;
  fields?: CmsField[];
  files?: { name: string; file: string; fields: CmsField[] }[];
}

const cms = parse(readFileSync('public/admin/config.yml', 'utf8'), { merge: true }) as {
  backend: { name: string; repo: string; branch: string };
  collections: CmsCollection[];
};

const collection = (name: string) => {
  const found = cms.collections.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No CMS collection named ${name}`);
  return found;
};

const blog = blogSchema({ author: z.string() });
const authors = authorSchema();
const legal = legalSchema();

function optionalInSchema(schema: z.ZodObject, key: string): boolean {
  return schema.shape[key]?.safeParse(undefined).success ?? false;
}

/** A field with a schema default is optional to zod but the CMS always writes it; both are fine. */
function expectLockstep(schema: z.ZodObject, fields: CmsField[], bodyField: boolean) {
  const cmsNames = fields.map((field) => field.name).filter((name) => name !== 'body');

  expect(cmsNames.toSorted()).toEqual(Object.keys(schema.shape).toSorted());
  expect(fields.some((field) => field.name === 'body')).toBe(bodyField);
  for (const field of fields.filter((candidate) => candidate.required === false)) {
    expect({ field: field.name, optional: optionalInSchema(schema, field.name) }).toEqual({
      field: field.name,
      optional: true,
    });
  }
}

describe('Sveltia CMS config', () => {
  it('commits to this repository', () => {
    expect(cms.backend).toMatchObject({
      name: 'github',
      repo: 'nextwebspark/lightmove-website',
      branch: 'main',
    });
  });

  it('edits exactly the blog fields the schema defines', () => {
    const posts = collection('blog');

    expect(posts.folder).toBe('src/content/blog');
    expectLockstep(blog, posts.fields ?? [], true);
  });

  it('offers exactly the blog tags the schema allows', () => {
    const tag = collection('blog').fields?.find((field) => field.name === 'tag');

    expect(tag?.options).toEqual([...BLOG_TAGS]);
  });

  it('edits exactly the author fields the schema defines', () => {
    const people = collection('authors');

    expect(people.extension).toBe('json');
    expectLockstep(authors, people.fields ?? [], false);
  });

  it('edits exactly the legal page fields the schema defines', () => {
    for (const file of collection('legal').files ?? []) {
      expect(file.file).toBe(`src/content/legal/${file.name}.md`);
      expectLockstep(legal, file.fields, true);
    }
  });

  it('offers every legal page in the content collection', () => {
    const onDisk = readdirSync('src/content/legal')
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.replace(/\.md$/, ''));
    const inCms = (collection('legal').files ?? []).map((file) => file.name);

    expect(inCms.toSorted()).toEqual(onDisk.toSorted());
  });
});
