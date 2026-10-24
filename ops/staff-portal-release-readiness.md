# Makabongwe staff access — review and invitation checklist

**Purpose:** Release one secure, functional staff workspace before granting an individual administrator access to learner or enquiry records. This file deliberately contains no personal email address or secret.

## Current implementation

- Staff sign-in with password, secure email-link option and account recovery in draft PR #5.
- Official Makabongwe logo, mobile login, protected application totals and the applications/enquiries register in draft PR #8.
- Privileged Supabase reads remain server-side, after \`requireAdmin\`; sample/demo sessions do not query real student records.
- The existing staff register avoids national identity and birth-date fields in its list.
- This is a staged release. **No preview READY result alone proves a working real account.**

## Owner release checklist (do not automate high-risk items)

1. Review the exact commit being proposed and the dependencies in PR #5 and PR #8.
2. Confirm the intended recipient's individual email and their authorized staff role. Do not place addresses in the repository.
3. Configure \`SUPABASE_URL\`, \`SUPABASE_PUBLISHABLE_KEY\`, \`MAKABONGWE_ADMIN_EMAILS\`, \`NEXT_PUBLIC_TURNSTILE_SITE_KEY\`, \`TURNSTILE_SECRET_KEY\` and the existing private Supabase server credential in the approved deployment environment. Only add values through protected host settings, never a chat or commit.
4. Use \`npm run admin:readiness\` **inside the appropriate environment** to check the presence of expected configuration without printing values. This only proves presence, not correct key content, email delivery, ownership or user access.
5. Configure Supabase Auth allowed redirects, including the exact deployed \`/auth/callback\` origin, and approved Auth SMTP.
6. Create/invite only the owner's verified, authorized staff account with a one-time provider workflow; require that person to set their own credentials.
7. In a protected test environment, verify real sign-in, permission rejection for unauthorized users, email recovery, session expiry/refresh, logout and page access. Make sure preview-demo sessions cannot access live records.
8. Verify the application and enquiry register displays actual zero-state honestly, then test with synthetic data **only in an isolated test database**. Do not insert test learners into production.
9. Complete mobile browser verification at 375px, 768px and 1440px, with no leakage of credentials or learner data.
10. Ask the owner for separate approval before the final merge, public-domain release and actual invitation.

## First-day staff workflow

The invited administrator signs in via the official staff URL, checks **Applications**, opens an individual record if necessary, checks **Enquiries**, then uses **Learner records** as the source of truth. The view is read-only initially: no payment changes, bulk exports, record deletion, outreach automation or publishing are enabled by default.

## Escalation and definitions

- Missing data/configuration must display "Unavailable", not a fabricated zero.
- Enquiry ≠ submitted application; application ≠ accepted learner; payment attempt ≠ confirmed payment.
- Disputed payment status, private identity evidence, account invitations and legal/privacy requests go to the owner.
- Preview-proven, deployed and production-live are different statuses and must be reported separately.
