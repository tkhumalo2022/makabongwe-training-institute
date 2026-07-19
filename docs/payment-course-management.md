# Course payment management

The website currently has no protected administrator interface. Do not add a public course-management route. Until authenticated admin roles are implemented, manage payment fields in **Supabase Dashboard → Table Editor → `cms_programmes`**.

Student records are stored once in `enrollments`. Supabase also exposes a read-only `all_enrolled_students` register and one read-only view per course. These course views are filters over the shared register; they do not duplicate personal information.

For each course, set `price_cents` and `registration_fee_cents` as whole cents (R500.00 is `50000`), then complete `department`, `duration`, `delivery_mode`, `location`, `available_intake`, and `image_url`. Keep `is_available` off until the course is published and its total payment amount is greater than zero. Never invent a price; obtain approved pricing from Makabongwe management.

The server-only helper in `app/lib/course-admin.ts` converts rand inputs to cents and enforces the same rules for a future authenticated admin UI. It is deliberately not connected to a public API endpoint.

## Supabase server key

Configure `SUPABASE_SECRET_KEY` with the current `sb_secret_...` server key. The application can temporarily retry `SUPABASE_SERVICE_ROLE_KEY` after a 401 while the legacy key remains available. Both variables are server-only: never prefix either with `NEXT_PUBLIC_`, import them into a client component, or commit their values. Server keys are sent through Supabase's `apikey` and `Authorization` headers.
