# Cloud Functions

One function, `contact`, receives the form at [lightmove.ai/contact](https://lightmove.ai/contact) and
emails it to hello@lightmove.ai through [Resend](https://resend.com). Firebase Hosting rewrites
`/api/contact` to it (see `firebase.json`), so the page posts same-origin and the CSP stays `'self'`.

| File                    | What                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/handler.ts`        | The endpoint: origin check, honeypot, per-IP rate limit, validation, send. No Firebase imports; tested in `tests/contact-handler.test.ts`. |
| `src/index.ts`          | Wraps the handler as a 2nd gen HTTPS function in `europe-west1`.                                                                           |
| `../src/lib/contact.ts` | Fields, reasons and limits shared with the page. esbuild bundles it into `lib/index.js`.                                                   |

The function stores nothing. It logs only the outcome and the reason category, never the sender's
details or message. The email in the hello@ mailbox is the only copy, so the enquiry retention period in
the Privacy Policy applies to that mailbox.

## Commands

```bash
npm run check:functions        # from the repo root: install, type check and bundle (CI runs this)
npm --prefix functions run build
```

## One-time setup (owner)

Nothing here runs until these steps are done. The site keeps showing email links instead of the form
while `PUBLIC_CONTACT_FORM_ENABLED` is unset.

1. **Billing.** Cloud Functions needs the Firebase project (`dograh-eu`) on the Blaze plan.
2. **Resend.** Verify the sending domain `lightmove.ai` in Resend (SPF and DKIM DNS records) and create
   an API key with _sending access_ only.
3. **Secret.** Store the key in Secret Manager:
   `firebase functions:secrets:set RESEND_API_KEY --project dograh-eu`
4. **Sender address (optional).** The default sender is `LightMove.ai website <website@lightmove.ai>`
   and the recipient is `hello@lightmove.ai`. To change them, create `functions/.env` with
   `CONTACT_FROM=...` and/or `CONTACT_TO=...`. The sender must be on the verified domain.
5. **Deploy permissions.** Grant the deploy service account (`GCP_SERVICE_ACCOUNT`) what a functions
   deploy needs: Cloud Functions Developer, Service Account User on the runtime service account, Secret
   Manager Viewer, Artifact Registry Writer and Cloud Build Editor. Also enable the Cloud Functions,
   Cloud Build, Artifact Registry, Cloud Run, Eventarc and Secret Manager APIs.
6. **Turn it on.** Set the repository variables `DEPLOY_FUNCTIONS=true` and
   `PUBLIC_CONTACT_FORM_ENABLED=true`, then cut a release. Deploy ships Hosting and the function
   together.
7. **Test once.** Send a message from the live form and confirm it arrives at hello@ with the right
   Reply-To.

## Limits

- 5 messages per IP per 10 minutes, counted per function instance (at most 2 instances).
- Messages are limited to 5,000 characters, and other fields are short.
- The endpoint only accepts posts whose `Origin` is lightmove.ai.

This stops casual abuse, not a determined attacker. If spam gets through, add Firebase App Check or a
privacy-friendly challenge, and record it in the Cookie Policy if it stores anything.
