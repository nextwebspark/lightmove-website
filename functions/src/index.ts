/**
 * Cloud Functions for lightmove.ai. Firebase Hosting rewrites /api/contact to `contact`
 * (firebase.json), so the form posts same-origin and the CSP stays 'self'.
 *
 * Setup, once per project (see functions/README.md):
 *   firebase functions:secrets:set RESEND_API_KEY
 * CONTACT_FROM must be an address on a domain verified in Resend.
 */
import { defineSecret, defineString } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { RateLimiter, handleContact, resendSender } from './handler';

const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const CONTACT_FROM = defineString('CONTACT_FROM', {
  default: 'LightMove.ai website <website@lightmove.ai>',
});
const CONTACT_TO = defineString('CONTACT_TO', { default: 'hello@lightmove.ai' });

// Five messages per IP per ten minutes, per instance.
const limiter = new RateLimiter(5, 10 * 60 * 1000);

export const contact = onRequest(
  {
    region: 'europe-west1',
    secrets: [RESEND_API_KEY],
    maxInstances: 2,
    memory: '256MiB',
    timeoutSeconds: 30,
    invoker: 'public',
  },
  async (req, res) => {
    const result = await handleContact(
      { method: req.method, headers: req.headers, body: req.body, ip: req.ip ?? 'unknown' },
      {
        send: resendSender({
          apiKey: RESEND_API_KEY.value(),
          from: CONTACT_FROM.value(),
          to: CONTACT_TO.value(),
        }),
        limiter,
        allowedOrigins: ['https://lightmove.ai', 'https://www.lightmove.ai'],
        log: (event, fields) => logger.info(event, fields),
      },
    );
    res.status(result.status).set(result.headers).send(result.body);
  },
);
