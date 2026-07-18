# Makabongwe Training Institute

Official website source for **Makabongwe Project (Pty) Ltd**, trading as Makabongwe Training Institute.

Makabongwe provides practical agricultural skills development, poultry enterprise support, food-security programmes, enterprise incubation, mentorship and end-to-end programme implementation from Richards Bay, KwaZulu-Natal.

## Website

Live site: [makabongwe-training.edureach70.chatgpt.site](https://makabongwe-training.edureach70.chatgpt.site)

The website includes:

- A conversion-focused homepage
- About, leadership, vision, mission and values
- Six detailed agricultural service pillars
- The Azibuye Emasisweni flagship poultry programme
- A complete 10-day poultry training journey
- Institutional partnership and impact information
- A structured programme enquiry experience
- A Supabase-backed CMS for services, programmes, qualifications, training days, delivery steps and values
- Responsive layouts for desktop, tablet and mobile

## Technology

- React 19
- Next.js 16-compatible App Router
- TypeScript
- Vercel-hosted native Next.js deployment

## Local development

Requirements:

- Node.js 22.13 or newer
- Supabase project for enquiry storage
- Resend account and verified sender for enquiry notifications

Install and start the development server:

```bash
npm install
npm run dev
```

Create a local environment file from the template:

```bash
cp .env.example .env.local
```

Required enquiry environment variables:

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY # legacy fallback
RESEND_API_KEY
RESEND_FROM_EMAIL
ENQUIRY_IP_HASH_SALT
```

Optional rate-limit overrides:

```text
ENQUIRY_RATE_LIMIT_MAX
ENQUIRY_RATE_LIMIT_WINDOW_SECONDS
```

Do not expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` or `ENQUIRY_IP_HASH_SALT` in client-side code. The server prefers `SUPABASE_SECRET_KEY` and supports `SUPABASE_SERVICE_ROLE_KEY` only as a legacy fallback. Configure the same variables in Vercel Project Settings before deploying the enquiry backend.

Create a production build:

```bash
npm run build
```

Run validation:

```bash
npm test
```

Run lint and type checking:

```bash
npm run typecheck
npx eslint . --ignore-pattern dist --ignore-pattern .next
```

## Enquiry backend

The contact form posts to `POST /api/enquiries`. The server endpoint validates and sanitises submissions, applies field-length limits, rejects honeypot and suspicious payloads, rate-limits by a salted IP hash stored in Supabase, inserts the enquiry into Supabase, then sends a Resend notification to `makabongweprojectsptyd@gmail.com`. If Resend is temporarily unavailable after the database insert succeeds, the submission remains saved and the notification status is recorded as failed.

Supabase migration:

```text
supabase/migrations/20260714155240_create_enquiries.sql
```

Apply the migration:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref YOUR_PROJECT_REF
npx supabase@latest db push
```

Local form test checklist:

1. Add the required variables to `.env.local`.
2. Run `npm run dev`.
3. Submit a valid enquiry from `/contact`.
4. Confirm a new row appears in `public.enquiries`.
5. Confirm Resend sends the notification email.
6. Try invalid submissions: missing required fields, malformed email, a filled honeypot field and repeated submissions from the same IP.

Resend setup:

1. Verify a sending domain or sender in Resend.
2. Create an API key with permission to send email.
3. Set `RESEND_FROM_EMAIL` to the verified sender, for example `Makabongwe Training Institute <enquiries@example.com>`.
4. The endpoint uses the visitor email as `reply_to` when sending the notification.

## Content management backend

The public website reads published content from six tables in the same Supabase
project used for enquiries:

```text
cms_services
cms_programmes
cms_training_days
cms_qualifications
cms_delivery_steps
cms_values
```

Edit these rows from the Supabase Table Editor. Use `sort_order` to control the
display order and `is_published` to show or hide an item. Website reads happen
only on the Next.js server through `SUPABASE_SERVICE_ROLE_KEY`; the key is never
sent to a visitor's browser. RLS is enabled and direct `anon` and `authenticated`
access is revoked. If Supabase is temporarily unavailable, the site keeps serving
the matching built-in content rather than returning a broken page. Content is
refreshed within five minutes after an edit.

The operational status endpoint is `GET /api/cms/status`. A healthy connection
returns HTTP 200 with `connected: true`; it never returns credentials or CMS row
content.

## Project structure

```text
app/
  about/          About and leadership
  contact/        Contact information and enquiry form
  partners/       Institutional partnership model
  programmes/     Flagship and packaged programmes
  services/       Six service pillars
  components/     Shared header, footer and UI sections
public/images/    Official logo and optimised website imagery
```

## Contact

**Mr H.P. Buthelezi**<br>
Owner and Managing Director<br>
+27 81 214 8384<br>
makabongweprojectsptyd@gmail.com<br>
12A Chat Crescent, Birdswood, Richards Bay, 3900

## Copyright

© 2026 Makabongwe Project (Pty) Ltd. All rights reserved.
