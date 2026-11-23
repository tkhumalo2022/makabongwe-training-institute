# Makabongwe Training Institute — online student portal and database migration
Date: 23 November 2026
Branch: feat/institute-student-spaces-20261123
Status: Locally implemented and tested; online database migration NOT executed.

## Product direction: Institutional Forest

The administrator homepage greets "Mr HP Buthelezi" based on Africa/Johannesburg local time. Makabongwe branding, square 4px buttons, forest-green primary actions, matte stone surfaces, accessible focus and compact registers. The private /admin and /learn experiences do not inherit the public marketing navigation.

## Working localhost experience

- Administration: http://127.0.0.1:4174/admin
- Learner sign-in: http://127.0.0.1:4174/learn
- Dedicated course page: http://127.0.0.1:4174/learn/course/CURRENT-SLUG
- Students tab: register a learner with full name + email + initial course. A student number in the format MTI-YYYY-NNNNNN is allocated once and never reused. An existing student can join further courses without another number.
- Course spaces tab: select one of five existing Makabongwe programmes; create published/draft modules, announcements and resource links for only that course.
- Email tab: inspect welcome, course assignment and announcement messages. In local mode these are queued previews, not delivered emails.
- Learner portal: student number + registered email + six-digit one-time code; expires after 10 minutes, maximum five verification attempts, signed HttpOnly student cookie restricted to enrolled courses. Staff review local test codes through an admin-only preview.
- Tests use example.invalid addresses and clean up their test records.

Not yet included: student file uploads, grading, assignments, certificates, attendance, direct messaging, paid courses, staff role delegation, production email activation, and live Neon-backed data.

## Why Neon over Supabase?

Neon (https://neon.tech) is the preferred independent SQL backend:
- The existing Makabongwe site uses PostgreSQL data structures and includes Drizzle ORM.
- PostgreSQL-to-PostgreSQL migration is simpler than converting learner relations into a document store.
- Neon offers a free starting tier, pooled connections suitable for Vercel and database branching for safe rehearsal.
- The Next.js server can query Neon without exposing a browser-accessible public data API.
- Resend, already used for current Makabongwe enquiries, remains the email service.

Alternative comparison:
- Appwrite: integrated authentication, messaging and storage; more disruptive relational migration than Neon. Appwrite environment variables exist in the Vercel project, but their current validity was not verified.
- Cloudflare D1: cost-efficient SQLite serverless, best if backend is moved to Cloudflare Workers; not a drop-in PostgreSQL replacement.
- Self-hosted Postgres: full ownership but incurs operational responsibilities for backups, maintenance and uptime.

## Neon migration design

The reviewed starter SQL is docs/neon-institute-schema.sql.

1. mti_students: student_number TEXT PRIMARY KEY; unique email, name and status.
2. mti_courses: one learning space per programme.
3. mti_course_enrolments: (student_number, course_id) composite key.
4. mti_course_modules, mti_course_announcements, mti_course_resources: scoped to a course.
5. mti_course_progress: progress per enrolled student and module.
6. mti_email_outbox: delivery status, provider IDs and audit fields.
7. mti_student_login_codes: durable hashed one-time challenges.

The existing Supabase enrolments, payments, enquiries and CMS are NOT migrated yet. Production website remains unchanged.

## Secure rollout checklist

1. Authorise a free Neon project under the institute's own account and confirm cost limits. No matching Neon project was found in the connected account today.
2. Create an isolated Neon development database branch and apply the reviewed SQL. Validate primary keys, foreign keys and unique email constraints.
3. Backfill programme definitions from the existing CMS and reconcile old programme IDs and slugs.
4. Export active learner data with authorisation only; review duplicates, assign one student number per unique learner, and retain a controlled mapping of old IDs. Never merge by name alone.
5. Reconcile course registrations and payments and verify counts. Never infer payment status from a notification email.
6. Replace the current LOCAL-ONLY institute-store file with an audited Neon-backed adapter. Current local prototype intentionally fails closed in production until database code is integrated.
7. Use persistent rate limits, transactional one-time verification challenges, strong email auth, and roles. Do not store plaintext student OTP codes in a production email outbox. Prefer a reviewed identity system such as Appwrite Auth or Auth.js over bespoke production auth.
8. Configure a verified domain in Resend and the server-only RESEND_API_KEY, RESEND_FROM_EMAIL and MAKABONGWE_EMAIL_DELIVERY=enabled settings. Set up durable delivery retries and monitoring.
9. Review POPIA privacy notices, student consent, retention limits, access control, secure upload storage, backups and administrative audit trails before inviting learners.
10. Test staging: admission -> student number -> verified email -> learner sign-in -> course access -> announcement mail -> logout.
11. Deploy a secured preview first; production cutover requires explicit approval and rollback plan.

## Confidentiality

Never commit .env.local, .admin-local, email verification codes, provider keys, database connection strings, or student documents. Never use browser-visible NEXT_PUBLIC_ variables for secrets.

## Current limitations

- Student email notifications are queued for localhost testing but are not sent.
- Neon is the recommended database destination, with schema prepared; no Neon database created or connected and no actual migration performed.
- No production deployment, production Supabase changes or payment changes were made.
