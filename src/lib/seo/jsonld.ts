import { APP, SITE } from '../site';
import { absoluteUrl } from './url';

export type JsonLdNode = { readonly '@type': string } & Readonly<Record<string, unknown>>;

export interface JsonLdGraph {
  readonly '@context': 'https://schema.org';
  readonly '@graph': readonly JsonLdNode[];
}

const ORGANIZATION_ID = `${SITE.url}/#organization`;
const WEBSITE_ID = `${SITE.url}/#website`;

export function organization(): JsonLdNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE.name,
    url: absoluteUrl('/'),
    logo: absoluteUrl('/icon-512.png'),
    email: SITE.emails.hello,
    parentOrganization: { '@type': 'Organization', name: SITE.company },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Limerick',
      addressCountry: 'IE',
    },
    ...(SITE.sameAs.length > 0 ? { sameAs: [...SITE.sameAs] } : {}),
  };
}

export function webSite(): JsonLdNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE.name,
    url: absoluteUrl('/'),
    inLanguage: SITE.locale,
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function softwareApplication(input: {
  description: string;
  featureList?: readonly string[];
}): JsonLdNode {
  return {
    '@type': 'SoftwareApplication',
    name: SITE.name,
    url: APP.url,
    description: input.description,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'AI voice agents and phone answering',
    operatingSystem: 'Web',
    ...(input.featureList && { featureList: [...input.featureList] }),
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export interface BlogPostingInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly imagePath: string;
  readonly publishedAt: Date;
  readonly updatedAt?: Date | undefined;
  readonly authorName: string;
  readonly tags: readonly string[];
}

export function blogPosting(input: BlogPostingInput): JsonLdNode {
  const url = absoluteUrl(input.path);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: input.title,
    description: input.description,
    url,
    mainEntityOfPage: url,
    image: absoluteUrl(input.imagePath),
    datePublished: input.publishedAt.toISOString(),
    dateModified: (input.updatedAt ?? input.publishedAt).toISOString(),
    inLanguage: SITE.locale,
    keywords: input.tags.join(', '),
    author: { '@type': 'Organization', name: input.authorName },
    publisher: { '@id': ORGANIZATION_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

export interface BreadcrumbTrailItem {
  readonly name: string;
  readonly path: string;
}

export function breadcrumbList(trail: readonly BreadcrumbTrailItem[]): JsonLdNode {
  if (trail.length === 0) {
    throw new Error('A breadcrumb trail needs at least one item.');
  }
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface FrequentlyAskedQuestion {
  readonly question: string;
  readonly answer: string;
}

export function faqPage(questions: readonly FrequentlyAskedQuestion[]): JsonLdNode {
  if (questions.length === 0) {
    throw new Error('An FAQPage needs at least one question.');
  }
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

export function graph(nodes: readonly JsonLdNode[]): JsonLdGraph {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

/** Escapes `<` so a string inside the data can never close the surrounding `<script>` element. */
export function serializeJsonLd(value: JsonLdGraph): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
