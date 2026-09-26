-- Learner delivery evidence foundation for Makabongwe Training Institute.
-- These tables extend the existing enrollments source of truth. They do not
-- duplicate learner identity data and are server-only by default.

create extension if not exists pgcrypto;

create table if not exists public.learner_attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  session_date date not null,
  session_title text not null,
  attendance_status text not null default 'present'
    check (attendance_status in ('present', 'absent', 'late', 'excused')),
  minutes_attended integer
    check (minutes_attended is null or minutes_attended between 0 and 1440),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_attendance_session_title_length
    check (char_length(session_title) between 2 and 180),
  constraint learner_attendance_notes_length
    check (notes is null or char_length(notes) <= 2000),
  unique (enrollment_id, session_date, session_title)
);

create index if not exists learner_attendance_enrollment_idx
  on public.learner_attendance (enrollment_id, session_date desc);

create index if not exists learner_attendance_status_idx
  on public.learner_attendance (attendance_status, session_date desc);

create table if not exists public.learner_assessments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  assessment_code text not null,
  assessment_title text not null,
  assessment_type text not null default 'formative'
    check (assessment_type in ('formative', 'summative', 'practical', 'rpl')),
  attempt integer not null default 1
    check (attempt between 1 and 20),
  result_status text not null default 'pending'
    check (
      result_status in (
        'pending',
        'competent',
        'not_yet_competent',
        'absent',
        'withdrawn'
      )
    ),
  score_percent numeric(5,2)
    check (score_percent is null or score_percent between 0 and 100),
  assessed_on date,
  assessor_name text,
  moderator_name text,
  moderation_status text not null default 'pending'
    check (
      moderation_status in (
        'pending',
        'upheld',
        'adjusted',
        'not_required'
      )
    ),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_assessment_code_length
    check (char_length(assessment_code) between 1 and 80),
  constraint learner_assessment_title_length
    check (char_length(assessment_title) between 2 and 180),
  constraint learner_assessor_name_length
    check (assessor_name is null or char_length(assessor_name) <= 160),
  constraint learner_moderator_name_length
    check (moderator_name is null or char_length(moderator_name) <= 160),
  constraint learner_assessment_notes_length
    check (notes is null or char_length(notes) <= 3000),
  unique (enrollment_id, assessment_code, attempt)
);

create index if not exists learner_assessments_enrollment_idx
  on public.learner_assessments (enrollment_id, assessed_on desc);

create index if not exists learner_assessments_result_idx
  on public.learner_assessments (result_status, assessed_on desc);

create or replace view public.learner_progress_summary
with (security_invoker = true)
as
select
  e.id as enrollment_id,
  'MTI-' || upper(left(replace(e.id::text, '-', ''), 8)) as student_reference,
  concat_ws(' ', e.first_name, e.last_name) as full_name,
  e.course_id,
  c.title as course_title,
  e.preferred_intake,
  e.status as enrolment_status,
  count(distinct a.id) as attendance_sessions_recorded,
  count(distinct a.id) filter (where a.attendance_status = 'present') as sessions_present,
  count(distinct s.id) as assessments_recorded,
  count(distinct s.id) filter (where s.result_status = 'competent') as assessments_competent,
  count(distinct s.id) filter (where s.result_status = 'not_yet_competent') as assessments_nyc
from public.enrollments e
join public.cms_programmes c on c.id = e.course_id
left join public.learner_attendance a on a.enrollment_id = e.id
left join public.learner_assessments s on s.enrollment_id = e.id
group by
  e.id,
  e.first_name,
  e.last_name,
  e.course_id,
  c.title,
  e.preferred_intake,
  e.status;

alter table public.learner_attendance enable row level security;
alter table public.learner_attendance force row level security;
alter table public.learner_assessments enable row level security;
alter table public.learner_assessments force row level security;

revoke all on public.learner_attendance from public, anon, authenticated;
revoke all on public.learner_assessments from public, anon, authenticated;
revoke all on public.learner_progress_summary from public, anon, authenticated;

grant select, insert, update, delete on public.learner_attendance to service_role;
grant select, insert, update, delete on public.learner_assessments to service_role;
grant select on public.learner_progress_summary to service_role;

comment on table public.learner_attendance is
  'Private attendance evidence linked to the existing enrollment source of truth.';
comment on table public.learner_assessments is
  'Private assessment and moderation outcomes linked to learner enrollments.';
comment on view public.learner_progress_summary is
  'Private learner progress summary for authenticated server-side administration.';
