# Makabongwe online institute — Neon + Resend preview

Branch: preview/makabongwe-institute. Deploy only to separate Vercel Next.js preview project makabongwe-institute-preview.
Do not replace existing Vite production website, Supabase or Paystack.

## Isolated services
- Neon PostgreSQL database: makabongwe_preview
- Verified Resend sending domain: updates.makabongwe.network
- Sender: Makabongwe Training Institute <students@updates.makabongwe.network>

## Server-side Preview environment variables (never commit values)
- NEON_DATABASE_URL: separate preview database connection
- MAKABONGWE_INSTITUTE_MODE=neon
- MAKABONGWE_ADMIN_MODE=neon
- MAKABONGWE_ADMIN_PASSWORD: randomly generated, preview-only secret
- MAKABONGWE_ADMIN_SESSION_SECRET: preview-only signing key
- MAKABONGWE_STUDENT_SESSION_SECRET: separate session signing key
- RESEND_FROM_EMAIL: verified Makabongwe sender
- MAKABONGWE_EMAIL_DELIVERY=disabled until email-key provisioning and security tests
- RESEND_API_KEY: sending-only secret required to enable delivery; not yet installed in preview

## Security and testing
- Do not use NEXT_PUBLIC_ names for secrets.
- Student number is the primary key; enrolments reference it.
- Email messages remain queued; no real student deliveries in preview.
- Admin and student access must deny anonymous requests.
- Student learning spaces must expose only enrolled courses.
- Run npm run typecheck, npm run lint -- --quiet, npm run build.
- Test localhost with synthetic example.invalid accounts, remove test rows.
- Run browser QA at 390px and 1440px; check runtime errors and horizontal overflow.
- Before live use: verify email key, delivery, persistent login throttling, OTP retention, staff roles and POPIA compliance.

## Migration
Do not automatically import existing Supabase students or payments. Reconcile old IDs, ensure deduplication and audit mapping before an explicitly approved data migration.