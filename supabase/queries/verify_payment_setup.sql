-- Read-only verification for the Makabongwe enrolment and Paystack schema.
-- Run in the Supabase SQL Editor. This query does not return secrets or applicant data.

select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('cms_programmes', 'enrollments', 'payments')
order by c.relname;

select table_name, ordinal_position, column_name, data_type, is_nullable,
       column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('cms_programmes', 'enrollments', 'payments')
order by table_name, ordinal_position;

select con.conname as constraint_name,
       con.conrelid::regclass as source_table,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
where con.contype = 'f'
  and con.conrelid in ('public.enrollments'::regclass, 'public.payments'::regclass)
order by source_table::text, constraint_name;

select tablename as table_name, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('cms_programmes', 'enrollments', 'payments')
order by tablename, indexname;

select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('cms_programmes', 'enrollments', 'payments')
order by table_name, grantee, privilege_type;

select tablename as table_name, policyname, permissive, roles, cmd,
       qual as using_expression, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('cms_programmes', 'enrollments', 'payments')
order by tablename, policyname;

select id, title, slug, is_published, is_available, price_cents,
       registration_fee_cents, price_cents + registration_fee_cents as total_cents,
       department, duration, delivery_mode, location, image_url,
       available_intake,
       array_remove(array[
         case when price_cents + registration_fee_cents <= 0 then 'zero payment total' end,
         case when department is null or btrim(department) = '' then 'department' end,
         case when duration is null or btrim(duration) = '' or duration = 'To be confirmed' then 'duration' end,
         case when delivery_mode is null or btrim(delivery_mode) = '' then 'delivery mode' end,
         case when location is null or btrim(location) = '' or location = 'To be confirmed' then 'location' end,
         case when image_url is null or btrim(image_url) = '' then 'image' end,
         case when available_intake is null or btrim(available_intake) = '' then 'intake' end,
         case when not is_published then 'unpublished' end,
         case when not is_available then 'not available' end
       ], null) as missing_or_blocking,
       (is_published and is_available and price_cents + registration_fee_cents > 0) as payment_ready
from public.cms_programmes
order by sort_order, id;
