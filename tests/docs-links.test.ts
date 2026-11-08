import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The app (failte-ai) links its provider forms and workflow nodes to these docs pages, at
// https://docs.lightmove.ai/<page> (the old lightmove.ai addresses 301 there, see firebase.json).
// failte-ai's api/tests/test_docs_links.py holds the same list, so renaming or removing a page here
// must change both, or a "<provider> docs" link goes dead.
const LINKED_FROM_THE_APP = [
  'integrations/telephony/asterisk-ari',
  'integrations/telephony/twilio',
  'integrations/telephony/telnyx',
  'integrations/telephony/vonage',
  'integrations/telephony/plivo',
  'integrations/telephony/exotel',
  'integrations/telephony/vobiz',
  'integrations/telephony/cloudonix',
  'integrations/telephony/dograh-sip',
  'integrations/paygent',
  'integrations/tuner',
];

const DOCS = 'docs-site/src/content/docs';
const fileFor = (page: string) =>
  [`${DOCS}/${page}.mdx`, `${DOCS}/${page}.md`].find((path) => existsSync(path));

describe('docs pages the app links to', () => {
  it.each(LINKED_FROM_THE_APP)('%s exists', (page) => {
    expect(fileFor(page)).toBeDefined();
  });

  it('every integrations page is one the app links to, or the overview', () => {
    const pages = readdirSync(`${DOCS}/integrations`, { recursive: true, encoding: 'utf8' })
      .filter((name) => /\.mdx?$/.test(name))
      .map((name) => `integrations/${name.replace(/\\/g, '/').replace(/\.mdx?$/, '')}`)
      .filter((page) => !page.endsWith('/index'));
    expect(pages.sort()).toEqual([...LINKED_FROM_THE_APP].sort());
  });

  it.each(LINKED_FROM_THE_APP)('%s carries no upstream links, embeds or docs host', (page) => {
    const text = readFileSync(fileFor(page) ?? '', 'utf8');
    expect(text).not.toMatch(/dograh\.(com|ai)/i);
    // Links between docs pages stay relative, so they work on any host (localhost, previews).
    expect(text).not.toContain('docs.lightmove.ai');
    expect(text).not.toMatch(/<iframe/i);
    expect(text).not.toContain('affiliate=');
  });
});
