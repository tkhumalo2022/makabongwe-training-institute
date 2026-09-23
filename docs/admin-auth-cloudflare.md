# Makabongwe admin login and free security setup

## Goal

Give authorized Makabongwe staff a simple sign-in experience without exposing
database credentials or relying on a remembered password as the only recovery
path.

## Login experience

The admin can:

1. Sign in with email and password.
2. Request a secure passwordless sign-in link.
3. Use "Forgot password?" to receive a recovery link and choose a new password.

Only email addresses in the server-side MAKABONGWE_ADMIN_EMAILS allowlist are
accepted for admin access.

## Security controls in the application

- Supabase Auth handles password storage and verification.
- The application never stores or logs the user's password.
- Access and refresh tokens are kept in HttpOnly SameSite cookies.
- Production cookies use Secure and __Host- cookie prefixes.
- Admin authorization is checked server-side.
- Recovery responses are deliberately generic to prevent account enumeration.
- Password changes require 12 or more characters.
- Password changes revoke the user's active sessions.
- Login and recovery requests require Cloudflare Turnstile.
- Auth POST endpoints reject cross-origin requests.

## Required environment variables

Add these through Vercel project settings. Do not put real secrets in Git:

SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
MAKABONGWE_ADMIN_EMAILS
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY

For local development only, TURNSTILE_DEV_BYPASS=true can bypass Turnstile.
Never set this bypass in production.

## Supabase dashboard setup

1. Authentication > URL Configuration
   - Site URL: https://www.makabongwe.network
   - Redirect URL: https://www.makabongwe.network/auth/callback
2. Authentication > Users
   - Create or invite the authorized admin account.
3. Authentication > Emails > SMTP Settings
   - Configure a production SMTP provider for reliable recovery emails.
   - Disable email-provider link tracking for auth emails.
4. Keep email/password authentication enabled.
5. Consider MFA after the initial login and recovery flow is stable.

## Cloudflare Free setup

1. Add makabongwe.network to Cloudflare and move DNS to Cloudflare.
2. Proxy the website records through Cloudflare.
3. Keep the Free Managed WAF ruleset enabled.
4. Keep Cloudflare DDoS protection enabled.
5. Create a Turnstile widget for:
   - makabongwe.network
   - www.makabongwe.network
6. Put the widget site key and secret in Vercel environment variables.
7. Add a Cloudflare rate-limit/custom security rule around /api/auth/* after
   observing normal login traffic. Start conservatively and confirm that real
   staff are not challenged repeatedly.

## Release gate

Do not merge or deploy this login feature until:

- Vercel preview builds successfully.
- lint, typecheck, build and auth tests pass.
- Turnstile keys are configured.
- Supabase redirect URLs are configured.
- the real admin email is allowlisted.
- password login, magic link, password recovery, refresh and logout are tested.
- no secret is committed to source control.
