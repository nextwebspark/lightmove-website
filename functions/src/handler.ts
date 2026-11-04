/**
 * The contact form endpoint, free of Firebase so it can be tested directly (tests/contact-handler.test.ts).
 * index.ts wraps it in an HTTPS function that Hosting serves at /api/contact.
 *
 * It answers JSON to the page's script, and redirects plain HTML form posts (no JavaScript) to
 * /contact/sent. It never logs or stores the message: the email to the team is the only copy.
 */
import {
  HONEYPOT_FIELD,
  composeContactEmail,
  validateContact,
  type ContactEmail,
} from '../../src/lib/contact';

export interface ContactRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  /** Already parsed by the platform: an object for JSON and urlencoded bodies. */
  body: unknown;
  ip: string;
}

export interface ContactResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface ContactDeps {
  send: (email: ContactEmail) => Promise<void>;
  limiter: RateLimiter;
  allowedOrigins: readonly string[];
  now?: () => Date;
  log?: (event: string, fields?: Record<string, unknown>) => void;
}

const header = (req: ContactRequest, name: string): string => {
  const value = req.headers[name.toLowerCase()];
  return (Array.isArray(value) ? value[0] : value) ?? '';
};

const wantsJson = (req: ContactRequest) =>
  header(req, 'accept').includes('application/json') ||
  header(req, 'content-type').includes('application/json');

const json = (status: number, body: unknown): ContactResponse => ({
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body),
});

/** Plain HTML for visitors without JavaScript. Static text only: nothing from the request is echoed. */
const page = (status: number, message: string): ContactResponse => ({
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  body: `<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Contact | LightMove.ai</title></head><body><main><h1>We couldn't send your message</h1><p>${message}</p><p>You can email us at <a href="mailto:hello@lightmove.ai">hello@lightmove.ai</a>, or <a href="/contact">go back to the form</a>.</p></main></body></html>`,
});

const fail = (req: ContactRequest, status: number, error: string, message: string, extra = {}) =>
  wantsJson(req) ? json(status, { ok: false, error, message, ...extra }) : page(status, message);

const succeed = (req: ContactRequest): ContactResponse =>
  wantsJson(req)
    ? json(200, { ok: true })
    : {
        status: 303,
        headers: { Location: '/contact/sent', 'Cache-Control': 'no-store' },
        body: '',
      };

export async function handleContact(
  req: ContactRequest,
  deps: ContactDeps,
): Promise<ContactResponse> {
  const log = deps.log ?? (() => {});

  if (req.method !== 'POST') {
    return { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' }, body: '' };
  }

  // Browsers send Origin on every POST; refusing other origins stops other sites posting the form.
  const origin = header(req, 'origin');
  if (origin && !deps.allowedOrigins.includes(origin)) {
    log('contact_rejected', { reason: 'origin' });
    return fail(req, 403, 'origin', 'This form only accepts messages sent from lightmove.ai.');
  }

  const body =
    req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : {};

  // Bots fill every field. Pretend it worked so they learn nothing, and send nothing.
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    log('contact_rejected', { reason: 'honeypot' });
    return succeed(req);
  }

  if (!deps.limiter.allow(req.ip)) {
    log('contact_rejected', { reason: 'rate_limit' });
    return fail(
      req,
      429,
      'rate_limited',
      "You've sent several messages in a short time. Please wait a few minutes and try again.",
    );
  }

  const result = validateContact(body);
  if (!result.ok) {
    return fail(req, 400, 'invalid', 'Some fields need attention.', { fields: result.errors });
  }

  try {
    await deps.send(composeContactEmail(result.value, (deps.now ?? (() => new Date()))()));
  } catch (error) {
    // The error comes from the email provider; it carries no form content.
    log('contact_send_failed', { error: error instanceof Error ? error.message : 'unknown' });
    return fail(
      req,
      502,
      'send_failed',
      "Something went wrong on our side and your message wasn't sent.",
    );
  }

  log('contact_sent', { reason: result.value.reason });
  return succeed(req);
}

/**
 * A fixed-window limit per IP, held in memory. Each function instance keeps its own count, so this is
 * a speed bump for scripts, not a guarantee; maxInstances in index.ts bounds the total.
 */
export class RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly clock: () => number = Date.now,
  ) {}

  allow(key: string): boolean {
    const now = this.clock();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (this.hits.size > 10_000) this.prune(now);
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  private prune(now: number) {
    for (const [key, entry] of this.hits) if (entry.resetAt <= now) this.hits.delete(key);
  }
}

/** Sends through Resend's HTTP API (https://resend.com/docs/api-reference/emails/send-email). */
export function resendSender(options: {
  apiKey: string;
  from: string;
  to: string;
  fetchImpl?: typeof fetch;
}): ContactDeps['send'] {
  const doFetch = options.fetchImpl ?? fetch;
  return async (email) => {
    const response = await doFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from,
        to: [options.to],
        reply_to: email.replyTo,
        subject: email.subject,
        text: email.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Resend answered HTTP ${response.status}`);
  };
}
