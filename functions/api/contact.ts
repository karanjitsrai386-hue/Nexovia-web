/// <reference types="@cloudflare/workers-types" />
/* Scoped to this file rather than tsconfig's `types` array — setting that
   globally would switch off automatic @types resolution for the Astro/React
   side of the project. */

/* POST /api/contact — Cloudflare Pages Function.
 *
 * Replaces a mailto: handoff. The old form built a mailto URL and navigated to
 * it, which means the enquiry only ever arrived if the visitor had a mail client
 * configured AND pressed send in it. On desktop Chrome with no mail client, the
 * click did nothing. Every one of those was a lost lead on a site whose single
 * biggest gap is customer proof.
 *
 * Deliberately degrades rather than pretending:
 *   - key configured   -> sends, returns { ok: true }
 *   - key missing      -> 503 { ok:false, reason:'unconfigured' }, and the form
 *                         falls back to mailto and says so
 *   - provider errors  -> 502, same fallback
 * The form never claims an enquiry was sent unless this returned ok.
 *
 * SETUP — one variable, in Cloudflare Pages > Settings > Environment variables:
 *
 *   RESEND_API_KEY   from https://resend.com (free tier covers this volume)
 *
 * Optional:
 *   CONTACT_TO       comma-separated recipients. Defaults to both founders.
 *   CONTACT_FROM     verified sender. Defaults to the site domain.
 *
 * The sending domain must be verified with the provider. Note the split
 * recorded in CLAUDE.md section 7 and confirmed by the client: the site is
 * nexoviasecuritysolutions.com (plural), mail is nexoviasecuritysolution.com
 * (singular). Verify the SINGULAR one — that is where mail lives.
 */

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

const DEFAULT_TO = 'prabhjeev@nexoviasecuritysolution.com,karanjit@nexoviasecuritysolution.com';
const DEFAULT_FROM = 'Nexovia site <site@nexoviasecuritysolution.com>';

/* Field -> label. Also the allow-list: anything not named here is dropped, so a
   bot posting extra fields cannot inject content into the email body.

   Both forms post here. /contact asks the demo set; /pilot/apply asks the demo
   set plus the pilot-specific questions below it, and sends form_type=pilot so
   the subject line says which arrived. A field missing from a given form is
   simply absent from the email — get() returns '' and the line is skipped. */
const FIELDS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
  company: 'Business',
  phone: 'Phone',
  sector: 'Sector',
  cameras: 'Camera count',
  camera_models: 'Camera makes & models',
  problem: 'What they are tired of finding out late',

  /* pilot application only */
  site_city: 'Site location',
  prove: 'What the pilot has to prove',
  contact_person: 'Named contact for feedback',
  start_when: 'Could start',
  sites_total: 'Sites operated',
  nvr: 'Existing NVR / VMS',
  footage: 'Footage they can share',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, reason: 'bad-request' }, 400);
  }

  const get = (k: string) => String(form.get(k) ?? '').trim();

  /* Honeypot. Real people never fill a field they cannot see; bots fill
     everything. Return ok so the bot believes it succeeded and does not retry
     with a different shape. */
  if (get('website')) return json({ ok: true });

  const name = get('name');
  const email = get('email');

  if (!name || !email) return json({ ok: false, reason: 'missing-required' }, 422);
  /* Deliberately loose. The input is type="email" so the browser has already
     done the strict pass; this only stops obvious junk reaching the provider. */
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, reason: 'bad-email' }, 422);
  }
  if (email.length > 200 || name.length > 200) {
    return json({ ok: false, reason: 'too-long' }, 422);
  }

  const lines: string[] = [];
  for (const [key, label] of Object.entries(FIELDS)) {
    const v = get(key);
    if (v) lines.push(`${label}: ${v.slice(0, 4000)}`);
  }

  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    /* Not an error in the code — the site is simply not wired up yet. Say so
       plainly so the form can fall back instead of swallowing the enquiry. */
    return json({ ok: false, reason: 'unconfigured' }, 503);
  }

  /* form_type is not in FIELDS on purpose — it steers the subject line rather
     than appearing as a line in the body. */
  const isPilot = get('form_type') === 'pilot';
  const subject = `${isPilot ? 'PILOT application' : 'Demo request'} — ${get('company') || name}`;
  const text = lines.join('\n');
  const html = `<pre style="font:14px/1.6 ui-monospace,monospace;white-space:pre-wrap">${esc(text)}</pre>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM || DEFAULT_FROM,
        to: (env.CONTACT_TO || DEFAULT_TO).split(',').map((s) => s.trim()).filter(Boolean),
        reply_to: email,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      /* Log the provider's reason for the Pages tail; never return it, since it
         can carry key or domain detail. */
      console.error('resend failed', res.status, await res.text().catch(() => ''));
      return json({ ok: false, reason: 'send-failed' }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('resend threw', err);
    return json({ ok: false, reason: 'send-failed' }, 502);
  }
};

/* Anything other than POST — a crawler, or someone pasting the URL in a bar.
   Pages routes POST to onRequestPost above, so this only ever sees the rest. */
export const onRequest: PagesFunction<Env> = () =>
  json({ ok: false, reason: 'method-not-allowed' }, 405);
