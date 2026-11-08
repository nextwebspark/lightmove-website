import { describe, expect, it } from 'vitest';
import { DOCS_URL, docsUrl } from './site';

describe('docs links', () => {
  it('point at docs.lightmove.ai unless PUBLIC_DOCS_URL says otherwise', () => {
    expect(DOCS_URL).toBe(
      import.meta.env.PUBLIC_DOCS_URL?.replace(/\/+$/, '') || 'https://docs.lightmove.ai',
    );
  });

  it('keep the docs path, with no /docs prefix', () => {
    expect(docsUrl()).toBe(`${DOCS_URL}/`);
    expect(docsUrl('/integrations/telephony/twilio')).toBe(
      `${DOCS_URL}/integrations/telephony/twilio`,
    );
    expect(docsUrl('go-live/web-widget')).toBe(`${DOCS_URL}/go-live/web-widget`);
  });
});
