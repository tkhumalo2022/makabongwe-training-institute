# Makabongwe Training Institute — Intranet and Neon Preview

**Stage:** Internal development preview, not a production release
**Branch:** `feat/mti-intranet-neon-preview-20261124`
**Local workspace:** `C:\Users\tkhum\Documents\Makabongwe-Intranet-Neon-Preview-20261124`

## Intent

Provide an institutional student experience inspired by familiar college intranet workflows without copying Rosebank College branding, code, images or identity. Makabongwe's own logo, green institutional palette and registered training programme names are retained.

### Staff workspace

- `/admin` remains a password-protected staff administration interface.
- Sections: Overview, Programmes, Students, Course spaces, Emails, Enrolments, Enquiries and Settings.
- Responsive institutional sidebar, registrar-style student directory and accessible forms.
- Student number is assigned **server-side by PostgreSQL** on registration; clients cannot choose or override it.
- Student registration and course assignment are separate: a student keeps one identity across courses.
- The Enrolments tab now reads the SQL-backed enrolment ledger, with student number, course, status and date plus an accessible programme filter.

### Student workspace

- `/learn`: private student sign-in with the existing student number and registered email.
- Verification is by a 6-digit, one-time email code; email delivery is **disabled by default** in preview.
- `/learn/course/[slug]`: access controls require a valid session and course enrolment.
- Unpublished modules, announcements and resources remain hidden from students.
- Responsive "My overview / Enrolled courses" navigation; accessible keyboard focus.

## Data sources

| Domain | Current source | Deployment impact |
|---|---|---|
| Public programmes, payment/enquiries | Existing website and Supabase/Paystack integrations | Unchanged |
| Local staff programme editor | Existing JSON-based local-preview store | Remains local |
| Student numbers, enrolments and course spaces | Separate Neon PostgreSQL preview project `orange-rice-17094398` | Connected in this feature branch only |
| Registration email / OTP | Database email outbox | Delivery disabled by default |
| Live learner registration | Not enabled | Requires approvals and further security work |

The Neon preview uses existing `mti_*` tables. Its tables have foreign keys, a unique student email index and a database-generated `MTI-YYYY-######` student number.

Five existing Makabongwe training programmes are present in Neon as **drafts**, not published intakes. Their names match existing Makabongwe website material. The current local JSON programme editor may show them as published *for localhost only*. These statuses are intentionally separate and must be reconciled in a future authorized migration.

## Configuration

The preview uses `.env.local`, ignored by Git. Required names:

- `NEON_DATABASE_URL` — private Neon connection string, never put in client-side code.
- `MAKABONGWE_INSTITUTE_MODE=neon` — explicitly enables Neon in the development workspace.
- `MAKABONGWE_EMAIL_DELIVERY=disabled` — prevents accidental mail.
- `MAKABONGWE_ADMIN_PASSWORD` and `MAKABONGWE_ADMIN_SESSION_SECRET` — existing server-side administrator configuration.
- `MAKABONGWE_STUDENT_SESSION_SECRET` — separate strong signing key required for production; development may use an existing admin session secret.

Do not commit `.env.local`, browser cookies, API keys, one-time codes or full student identity data.

## QA

Run:

```powershell
npm run typecheck
npm run build
npm run lint
node --env-file=.env.local scripts/check-mti-neon.mjs
```

Local ports: `http://127.0.0.1:4184/admin` and `http://127.0.0.1:4184/learn` when the preview server is running.

The local end-to-end suite confirmed:
- API access denied without an admin session
- Administrator login, SQL-backed registration, generated student number, welcome outbox
- Duplicate registration rejected
- One-time code request and verification
- Student session, same student number in two courses, course-level access control
- Draft lesson, announcement and resource entries saved to Neon but not exposed to students
- No real emails sent

**Test data:** The preview database includes a dummy test identity called `Preview Student Registration`, number `MTI-2026-000002`, using an `example.invalid` email address. It is not a real learner and must not be migrated to production.

## Release controls / owner approval gate

Safe to approve without another owner decision:
- Responsive styling and copy, accessibility improvements, local/branch-only tests
- Seed **draft** programmes in dedicated preview database
- Use only dummy preview student records
- Push this independent Git feature branch for review

**Not authorized for automatic promotion:**
- Live-domain deployment, production database migrations, enabling public registration
- Real student data imports or bulk communications
- Enabling Resend, changing payment logic, or creating live checkout rules
- Changing staff role/permissions, password policies or the canonical company branding
- Destructive SQL or deleting prior user data

Before production, implement robust multi-admin identity and roles, a durable distributed OTP rate limit, audited writes, data retention/backups, configured and verified sender domain, complete student privacy and security reviews, end-to-end student consent and rollout procedures.

## Source design principles

Code uses the repo's existing UI and the institution's own logo. External design references provide **guidelines only**: Codrops editorial information hierarchy, Anthropic frontend-design principles, and Vercel Web Interface Guidelines. No proprietary Rosebank College assets or code are used.
