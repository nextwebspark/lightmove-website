import { describe, expect, it, vi } from 'vitest';
import {
  RateLimiter,
  handleContact,
  resendSender,
  type ContactRequest,
} from '../functions/src/handler';
import { SITE } from '../src/lib/site';

const form = {
  reason: 'partnership',
  name: 'Seán Byrne',
  email: 'sean@voip.ie',
  company: 'Byrne Telecom',
  message: 'We resell SIP trunks and want to offer voice agents to our customers.',
};

const request = (overrides: Partial<ContactRequest> = {}): ContactRequest => ({
  method: 'POST',
  headers: {
    origin: 'https://lightmove.ai',
    accept: 'application/json',
    'content-type': 'application/json',
  },
  body: form,
  ip: '203.0.113.7',
  ...overrides,
});

const setup = () => {
  const send = vi.fn(async () => {});
  const log = vi.fn();
  const deps = {
    send,
    log,
    limiter: new RateLimiter(5, 60_000),
    allowedOrigins: ['https://lightmove.ai'],
    now: () => new Date('2026-11-01T12:00:00Z'),
  };
  return { send, log, deps };
};

describe('handleContact', () => {
  it('sends one email and answers JSON', async () => {
    const { send, deps } = setup();
    const res = await handleContact(request(), deps);

    expect(res.status).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: '[Website] VoIP or reseller partnership (Seán Byrne)',
        replyTo: 'sean@voip.ie',
      }),
    );
  });

  it('redirects a plain HTML form post to the thank-you page', async () => {
    const { deps } = setup();
    const res = await handleContact(
      request({
        headers: {
          origin: 'https://lightmove.ai',
          'content-type': 'application/x-www-form-urlencoded',
        },
      }),
      deps,
    );

    expect(res.status).toBe(303);
    expect(res.headers.Location).toBe('/contact/sent');
  });

  it('rejects other origins without sending', async () => {
    const { send, deps } = setup();
    const res = await handleContact(
      request({ headers: { origin: 'https://evil.example', accept: 'application/json' } }),
      deps,
    );

    expect(res.status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('only accepts POST', async () => {
    const { deps } = setup();
    expect((await handleContact(request({ method: 'GET' }), deps)).status).toBe(405);
  });

  it('pretends to accept honeypot submissions but sends nothing', async () => {
    const { send, deps } = setup();
    const res = await handleContact(request({ body: { ...form, website: 'http://spam' } }), deps);

    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('returns field errors for an invalid submission', async () => {
    const { send, deps } = setup();
    const res = await handleContact(request({ body: { ...form, reason: 'other' } }), deps);

    expect(res.status).toBe(400);
    expect(JSON.parse(res.body).fields).toHaveProperty('reasonOther');
    expect(send).not.toHaveBeenCalled();
  });

  it('rate-limits one IP', async () => {
    const { send, deps } = setup();
    deps.limiter = new RateLimiter(2, 60_000);
    const statuses = [];
    for (let i = 0; i < 3; i++) statuses.push((await handleContact(request(), deps)).status);

    expect(statuses).toEqual([200, 200, 429]);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('reports a provider failure without leaking the message into logs', async () => {
    const { log, deps } = setup();
    deps.send = vi.fn(async () => {
      throw new Error('Resend answered HTTP 500');
    });
    const res = await handleContact(request(), deps);

    expect(res.status).toBe(502);
    expect(JSON.stringify(log.mock.calls)).not.toContain(form.message);
    expect(JSON.stringify(log.mock.calls)).not.toContain(form.email);
  });

  it('never echoes request content into the no-JavaScript error page', async () => {
    const { deps } = setup();
    const res = await handleContact(
      request({
        headers: { origin: 'https://lightmove.ai' },
        body: { ...form, name: '<script>alert(1)</script>', email: 'bad' },
      }),
      deps,
    );

    expect(res.status).toBe(400);
    expect(res.body).not.toContain('<script>');
  });
});

describe('RateLimiter', () => {
  it('opens again after the window', () => {
    let now = 0;
    const limiter = new RateLimiter(1, 1000, () => now);
    expect(limiter.allow('a')).toBe(true);
    expect(limiter.allow('a')).toBe(false);
    expect(limiter.allow('b')).toBe(true);
    now = 1000;
    expect(limiter.allow('a')).toBe(true);
  });
});

describe('resendSender', () => {
  it('posts to Resend with the reply-to set to the sender', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const send = resendSender({
      apiKey: 're_test',
      from: 'LightMove.ai website <website@lightmove.ai>',
      to: SITE.emails.hello,
      fetchImpl,
    });
    await send({ subject: 'S', text: 'T', replyTo: 'sean@voip.ie' });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'LightMove.ai website <website@lightmove.ai>',
      to: ['hello@lightmove.ai'],
      reply_to: 'sean@voip.ie',
      subject: 'S',
      text: 'T',
    });
  });

  it('throws when Resend refuses', async () => {
    const send = resendSender({
      apiKey: 'x',
      from: 'f',
      to: 't',
      fetchImpl: async () => new Response('', { status: 422 }),
    });
    await expect(send({ subject: 'S', text: 'T', replyTo: 'r' })).rejects.toThrow('422');
  });
});
