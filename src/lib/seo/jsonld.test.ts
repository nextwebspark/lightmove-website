import { describe, expect, it } from 'vitest';
import {
  blogPosting,
  breadcrumbList,
  faqPage,
  graph,
  organization,
  serializeJsonLd,
  softwareApplication,
  webSite,
} from './jsonld';

describe('structured data', () => {
  it('links the website and the product back to one organization', () => {
    const org = organization();

    expect(org['@id']).toBe('https://lightmove.ai/#organization');
    expect(webSite().publisher).toEqual({ '@id': org['@id'] });
    expect(softwareApplication({ description: 'x' }).publisher).toEqual({ '@id': org['@id'] });
  });

  it('never publishes an empty sameAs list', () => {
    expect(organization()).not.toHaveProperty('sameAs');
  });

  it('describes a post with canonical URLs and ISO dates', () => {
    const post = blogPosting({
      title: 'Hello',
      description: 'A post.',
      path: '/blog/hello/',
      imagePath: '/og/blog/hello.png',
      publishedAt: new Date('2026-10-16T00:00:00Z'),
      authorName: 'The LightMove team',
      tags: ['Guides'],
    });

    expect(post.url).toBe('https://lightmove.ai/blog/hello');
    expect(post.image).toBe('https://lightmove.ai/og/blog/hello.png');
    expect(post.datePublished).toBe('2026-10-16T00:00:00.000Z');
    expect(post.dateModified).toBe(post.datePublished);
  });

  it('numbers breadcrumbs from one', () => {
    const trail = breadcrumbList([
      { name: 'Blog', path: '/blog' },
      { name: 'Guides', path: '/blog/tag/guides' },
    ]);

    expect(trail.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Blog', item: 'https://lightmove.ai/blog' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Guides',
        item: 'https://lightmove.ai/blog/tag/guides',
      },
    ]);
  });

  it('refuses empty breadcrumb trails and FAQ pages', () => {
    expect(() => breadcrumbList([])).toThrow();
    expect(() => faqPage([])).toThrow();
  });

  it('serializes so the data can never close its <script> element', () => {
    const json = serializeJsonLd(graph([faqPage([{ question: '</script>?', answer: 'a' }])]));

    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)['@graph'][0].mainEntity[0].name).toBe('</script>?');
  });
});
