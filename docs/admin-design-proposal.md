# Makabongwe administration — human-centred interface direction

Status: Design proposal for Mr HP Buthelezi. Do not interpret proposed components as live features.
Date: 23 November 2026.

## Primary job

Give the training institute's director a reliable place to manage upcoming agricultural training programmes without needing to edit code or access developer tools. Put actual work first: programmes, intake dates, locations, costs, enrolment readiness, learner registers, enquiries and reporting. Local-only preview records must always be visibly labelled as local; never present placeholder data as production results.

## Open-source source material (research references, not cloned UI)

- Tabler: https://github.com/tabler/tabler (MIT). Reference: data tables, compact navigation, form structures, status indicators. Its Bootstrap theme is **not** installed.
- Mantine: https://github.com/mantinedev/mantine (MIT). Reference: stable field labels, form validation, accessible date/time selectors and dialogs. Its React component library is **not** installed.
- Refine: https://github.com/refinedev/refine (MIT). Reference: record list/detail/edit workflows, paging, table filters and bulk action safety. Its framework is **not** installed.
- PatternFly: https://www.patternfly.org/ (open-source enterprise design system). Reference: accessibility and information hierarchy.

## Recommended visual direction: Institutional Modern

Do not make Makabongwe look like a generic tech startup dashboard. The aesthetic should be restrained, official, practical, agricultural and appropriate for daily use on a low-powered laptop.

Palette:
- Site background: #F5F6F2 (stone / matte off-white).
- Cards: #FFFFFF.
- Body text: #1B2922 (almost black green).
- Primary buttons and primary navigation: #2E5540 (forest).
- Success: #2D704B.
- Amber attention: #9A6B27 with a pale amber background.
- Destructive: #A43D35, never use it as the primary interface accent.
- Hairlines / table dividers: #D8E0D8.
- Accent: #A68756 (aged brass) for rare deliberate emphasis only.

Buttons and controls:
- One solid dark-green primary button per section; height 44px and 4px corner radius.
- Secondary: white fill, green text, 1px green border, same geometry.
- Tertiary: text link with clear focus and hover state.
- No pill buttons, glossy gradients, floating/neon shadows or decorative arrows on every action.
- All click targets at least 44px high for touch.

Typography:
- Body, labels and tables: readable restrained system sans or open-source Public Sans.
- Titles: understated editorial serif *only if needed*; do not use a giant italic AI-style hero headline.
- Always distinguish labels (12px), body (14-15px), and section titles (24-32px).
- No tiny unreadable table text and no six-font-family visual mixture.

Surfaces and texture:
- Flat matte stone background; no blur, glassmorphism, fake noise grain, dark purple, neon or glowing shapes.
- Real photographic agriculture content belongs inside relevant programme detail pages only.
- Use consistent 1px borders and alternating table content where it aids scanning, not texture for decoration.
- Use the actual Makabongwe logo already in /public/images/makabongwe-logo.webp.

## Homepage hierarchy

1. Real salutation, e.g. "Good evening, Mr HP Buthelezi." The salutation, date and time are evaluated in Africa/Johannesburg and updated without refreshing the page.
2. A compact strip with the current data source (local draft or connected Supabase), last refreshed at time and Refresh control.
3. Real operational priorities such as draft programmes awaiting approval, upcoming intakes, and pending applications — only if supported by actual data.
4. Single well-designed programme management table with search, sort, and publish status.
5. Specific next actions (Create programme, Review intake, Export verified report). No decorative stats or dummy charts.

## Suggested future navigation, subject to backend readiness

Overview · Programmes · Intakes · Learners · Applications · Payments · Reports · Settings.

Do not pretend absent features are active. The currently implemented tabs are Overview, Programmes, Enrolments, Enquiries and Settings. Add future navigation items only as their secure workflows are implemented and tested.

## Current implementation delivered

- A standalone administration layout (no public-site header or footer).
- Authentic Makabongwe logo in the admin sidebar and login.
- Dynamic personalised greeting for Mr HP Buthelezi: morning / afternoon / evening, South African date and time.
- Current programme statistics refreshed every 60 seconds while the dashboard is open, plus manual refresh and last-refreshed status.
- Existing local draft programme editor, validation, protected API and responsive layout retained.

## Important distinction

The existing default `MAKABONGWE_ADMIN_MODE=local` has local-only programme content. It is NOT proof that live learner payment or enquiry records are connected to the browser. Do not enable production writes, API keys in browser, live payment actions or staff-user permissions without a separate security review and approval.
