import { describe, expect, it } from 'vitest';

import { gmailComposeUrl, mailtoUrl, outlookComposeUrl } from '../src/lib/mailCompose';

describe('mail compose links', () => {
  it('builds a mailto link with an encoded subject', () => {
    expect(mailtoUrl('hello@lightmove.ai', 'Pricing and billing')).toBe(
      'mailto:hello@lightmove.ai?subject=Pricing%20and%20billing',
    );
    expect(mailtoUrl('hello@lightmove.ai')).toBe('mailto:hello@lightmove.ai');
  });

  it('opens Gmail compose with the address and subject', () => {
    const url = new URL(gmailComposeUrl('hello@lightmove.ai', 'VoIP & reseller'));
    expect(url.origin).toBe('https://mail.google.com');
    expect(url.searchParams.get('view')).toBe('cm');
    expect(url.searchParams.get('to')).toBe('hello@lightmove.ai');
    expect(url.searchParams.get('su')).toBe('VoIP & reseller');
  });

  it('opens Outlook on the web compose with the address and subject', () => {
    const url = new URL(outlookComposeUrl('hello@lightmove.ai', 'Help with my account'));
    expect(url.origin).toBe('https://outlook.office.com');
    expect(url.pathname).toBe('/mail/deeplink/compose');
    expect(url.searchParams.get('to')).toBe('hello@lightmove.ai');
    expect(url.searchParams.get('subject')).toBe('Help with my account');
  });
});
