# Makabongwe administration — localhost handover

Branch: feat/admin-programme-operations-20261123

## Start and access

1. Open this cloned folder in Visual Studio Code.
2. Start the development server with `npm run dev:admin` (Next.js, Node runtime).
3. Visit `http://127.0.0.1:4174/admin`.
4. Sign in with the password in `.env.local`, under `MAKABONGWE_ADMIN_PASSWORD`.

The local password and session signing secret were generated for this machine, and `.env.local` is ignored by Git. Never send the password or secret through a commit or screenshot.

## Current admin features

- Overview showing programmes, published programmes and open enrolment count.
- Create programmes as unpublished drafts.
- Edit titles, descriptions, departments, duration, delivery mode, venue and intake.
- Set course cost and registration fee in South African rand.
- Publish or unpublish individual programmes.
- Open enrolment only on published programmes with a non-zero fee.
- Inspect aggregate enrolment, enquiry and payment counts when Supabase is connected.
- Admin sessions use an HttpOnly, SameSite=Strict, signed cookie, with rate-limited login and origin checks.
- Local admin changes are reflected on localhost `/programmes`.
- No delete button; archival is handled through unpublishing to preserve linked learner and payment records.

## Database connection

The repository's existing Supabase tables (`cms_programmes`, `enrollments`, `enquiries`, `payments`) are retained. On this machine, `MAKABONGWE_ADMIN_MODE=local` is the safe default; it stores draft changes in `.admin-local/programmes.json`, not the production database. The file is ignored by Git.

To activate the Supabase-backed admin backend on an approved environment, set:
- `MAKABONGWE_ADMIN_MODE=supabase`
- `SUPABASE_URL` to your actual Makabongwe project URL
- `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) on the **server only**.

Do not turn on live writes until the owner approves the release, admin session restrictions are tested on the hosting platform, and the live keys are in the hosting provider's secret store. Supabase service role keys bypass RLS and must never be placed in client code or `NEXT_PUBLIC_*` variables. No live database migrations or payment changes are part of this local admin sprint.

## Test checklist

- `npm run typecheck`
- `npm run lint`
- `node .admin-local/qa-local.cjs` — local-only API integration test that restores test data
- Open `/admin` on desktop and mobile, test sign-in and programme editing.
- Open `/programmes` locally to confirm published drafts display.
- Confirm anonymous `GET /api/admin/programmes` returns HTTP 401.

## Planned next stage

The enrolment, enquiry and payment views deliberately show aggregate information only. Individual learner identities and transaction details remain private in Supabase until multi-user staff roles and permissions have been agreed for your dad and any other admin staff. Do not add sensitive student fields to public pages or draft files.

Do not merge/deploy this branch automatically.
