-- Keep each student's enrolment in one private source table, then expose
-- read-only course registers for simple administration in Supabase Studio.
create or replace view public.all_enrolled_students
with (security_invoker = true)
as
select
  e.id as enrolment_id,
  'MTI-' || upper(left(replace(e.id::text, '-', ''), 8)) as student_reference,
  e.first_name,
  e.last_name,
  concat_ws(' ', e.first_name, e.last_name) as full_name,
  e.id_passport_number,
  e.date_of_birth,
  e.email,
  e.phone,
  e.address,
  e.qualification as highest_qualification,
  e.preferred_intake,
  e.notes,
  e.course_id,
  c.slug as course_slug,
  c.title as course_title,
  e.status as enrolment_status,
  e.payment_status,
  latest_payment.status as latest_payment_status,
  latest_payment.amount as payment_amount_cents,
  latest_payment.paystack_reference,
  latest_payment.paid_at,
  e.created_at as enrolled_at,
  e.updated_at
from public.enrollments e
join public.cms_programmes c on c.id = e.course_id
left join lateral (
  select p.status, p.amount, p.paystack_reference, p.paid_at
  from public.payments p
  where p.enrollment_id = e.id
  order by p.created_at desc, p.id desc
  limit 1
) latest_payment on true;

create or replace view public.students_poultry_starter_workshop
with (security_invoker = true)
as
select *
from public.all_enrolled_students
where course_slug = 'poultry-starter-workshop';

create or replace view public.students_broiler_business_bootcamp
with (security_invoker = true)
as
select *
from public.all_enrolled_students
where course_slug = 'broiler-business-bootcamp';

create or replace view public.students_school_food_garden_package
with (security_invoker = true)
as
select *
from public.all_enrolled_students
where course_slug = 'school-food-garden-package';

create or replace view public.students_farm_cooperative_upskilling
with (security_invoker = true)
as
select *
from public.all_enrolled_students
where course_slug = 'farm-cooperative-upskilling';

create or replace view public.students_100_youth_poultry_entrepreneurs
with (security_invoker = true)
as
select *
from public.all_enrolled_students
where course_slug = '100-youth-poultry-entrepreneurs';

revoke all on public.all_enrolled_students,
  public.students_poultry_starter_workshop,
  public.students_broiler_business_bootcamp,
  public.students_school_food_garden_package,
  public.students_farm_cooperative_upskilling,
  public.students_100_youth_poultry_entrepreneurs
from public, anon, authenticated;

grant select on public.all_enrolled_students,
  public.students_poultry_starter_workshop,
  public.students_broiler_business_bootcamp,
  public.students_school_food_garden_package,
  public.students_farm_cooperative_upskilling,
  public.students_100_youth_poultry_entrepreneurs
to service_role;

comment on view public.all_enrolled_students is
  'Private master register of all course enrolments. Student data is stored once in enrollments.';
comment on view public.students_poultry_starter_workshop is
  'Read-only Poultry Starter Workshop register backed by the shared enrolments table.';
comment on view public.students_broiler_business_bootcamp is
  'Read-only Broiler Business Bootcamp register backed by the shared enrolments table.';
comment on view public.students_school_food_garden_package is
  'Read-only School Food Garden Package register backed by the shared enrolments table.';
comment on view public.students_farm_cooperative_upskilling is
  'Read-only Farm and Cooperative Upskilling register backed by the shared enrolments table.';
comment on view public.students_100_youth_poultry_entrepreneurs is
  'Read-only 100 Youth Poultry Entrepreneurs register backed by the shared enrolments table.';
