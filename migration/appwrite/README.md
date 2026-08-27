# Makabongwe Supabase → Appwrite non-production migration

This directory is intentionally non-production. It must not be used to switch production traffic without a separate approved cutover.

## Security model

- Browser clients receive no privileged Appwrite key.
- Appwrite tables are created with no client permissions.
- The `enrollment-documents` bucket is private and file-security enabled.
- Privileged access remains behind Vercel/Next.js server routes.
- Supabase remains the production source until an explicit cutover.
- Appwrite Auth is not part of this migration because the verified Supabase project has zero application users.

## Required non-production server environment variables

```text
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=makabongwe_nonprod
```

The migration tools also read the existing server-side Supabase variables:

```text
SUPABASE_URL=
SUPABASE_SECRET_KEY=
# legacy fallback only
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose `APPWRITE_API_KEY`, `SUPABASE_SECRET_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` through `NEXT_PUBLIC_*` variables or browser code.

## Controlled sequence

1. Create a dedicated non-production Appwrite project manually or through an approved authenticated Appwrite management surface.
2. Create a narrowly scoped server API key only for the non-production project.
3. Run `node migration/appwrite/provision.mjs`.
4. Confirm all ten tables exist with zero client permissions and confirm the private storage bucket configuration.
5. Run `node migration/appwrite/migrate-cms.mjs`.
6. Run `node migration/appwrite/validate-cms.mjs`.
7. Validation must show exactly 39 source rows and 39 destination rows with zero mismatches before any application route is switched.
8. Add Appwrite credentials to a Vercel Preview environment only. Do not change Production variables.
9. Wire one provider path at a time in Preview and test it.
10. Keep Supabase implementation and credentials during the rollback window.

## Expected CMS totals

| Table | Rows |
|---|---:|
| cms_delivery_steps | 7 |
| cms_programmes | 5 |
| cms_qualifications | 5 |
| cms_services | 6 |
| cms_training_days | 10 |
| cms_values | 6 |
| **Total** | **39** |

The migration script aborts if the live Supabase counts drift from this baseline. If that happens, repeat the inventory before migrating.

## ID strategy

The CMS source bigint IDs (`1`, `2`, etc.) are preserved directly as Appwrite row IDs by converting them to strings. Future transactional UUIDs can likewise be preserved as Appwrite row IDs.

Foreign-key intent is initially stored as explicit indexed reference fields (`course_id`, `enrollment_id`). Appwrite relationship columns are deliberately deferred until Preview testing proves they improve the model without introducing permission or rollback complexity.

## SQL views

Do not create Appwrite copies of the six PostgreSQL views.

### `all_enrolled_students`

Later implement as a Vercel server-side report query:

1. list enrollments;
2. fetch/map `cms_programmes` by `course_id`;
3. fetch payments for the relevant enrollment IDs;
4. select the latest payment per enrollment by `created_at`;
5. emit the same report shape used by the current SQL view.

### Course-specific student views

These become filters over the `all_enrolled_students` report result:

- `students_100_youth_poultry_entrepreneurs` → programme slug `100-youth-poultry-entrepreneurs`
- `students_broiler_business_bootcamp` → `broiler-business-bootcamp`
- `students_farm_cooperative_upskilling` → `farm-cooperative-upskilling`
- `students_poultry_starter_workshop` → `poultry-starter-workshop`
- `students_school_food_garden_package` → `school-food-garden-package`

No duplicate report tables should be created.

## Paystack

Keep Paystack on Vercel. Do not alter HMAC verification, amount verification, currency verification, reference uniqueness, remote transaction verification, or idempotent success handling during the database-provider migration. Only replace persistence calls after CMS validation.

## Resend

Keep Resend on Vercel. `RESEND_API_KEY` and `RESEND_FROM_EMAIL` remain server-only. Do not move enquiry email into Appwrite Messaging during this phase.

## Rollback

Production Supabase is not modified or removed. If Preview Appwrite validation fails, stop using the Appwrite Preview configuration and continue using the existing Supabase path. No data deletion is part of this phase.
