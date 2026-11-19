# Login design review — 19 November 2026

Source: https://github.com/LemonFace0309/charles-skills
Reviewed commit: baf4272436fb65bc83e01e15b7d95755488d92ee
Reference: skills/design/charles-unslop/SKILL.md, references/signs.md and references/tokens.md.
The source was cloned as a reference on the laptop. No upstream CLI, install hook, runtime script or auto-update was used.

Credit: Charles Liu's charles-unslop, adapted from unslop by Damir Sokolovsky (@heydamir), CC BY 4.0, merged with Emil Kowalski's unslop-design. The principles were applied to this site's existing identity; no upstream runtime code was copied.

Scope: presentation of the existing login screen, responsive controls, keyboard focus and password visibility. API routes, credentials, allowlists, cookie settings, rates and authorization were preserved.

Verification: real pages at 1440×900, 1366×768, 390×844 and 320×740, with overflow, visible assets and input text size checks. Form feedback and the handoff to the existing dashboard were exercised with browser-only test responses. These tests do not establish successful production-account authentication. No real credentials or learner/customer data were used.

Direction: a staff doorway within the agricultural training scene already used by Makabongwe. The existing logo replaces the MTI placeholder. Forest green controls, quieter sentence-case type and fewer separators keep the form readable over the training image.
Audit: initial-letter tile in place of the logo; over-heavy uppercase type; oversized empty background; repeated access/recovery text; redundant divider.
Base: origin/feat/secure-admin-login-recovery (4201015). The login and recovery endpoints are on this feature branch, not main. Do not merge this design into main without reviewing that authentication feature's scope.
Checks: production build and TypeScript check; 10 authentication security tests; 3 HTTP authentication tests. The unconfigured local server correctly keeps staff login disabled. Production account login and a configured Turnstile challenge remain deployment checks.
Local review: http://127.0.0.1:4311/admin/login
