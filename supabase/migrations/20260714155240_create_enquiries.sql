create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new',
  full_name text not null,
  organisation text,
  phone text not null,
  email text not null,
  service_programme text not null,
  programme_location text,
  estimated_learners integer,
  preferred_start_date date,
  message text not null,
  source_page text not null default '/contact',
  ip_hash text,
  user_agent text,
  notification_status text not null default 'pending',
  notification_error text,
  notified_at timestamptz,
  constraint enquiries_status_check
    check (status in ('new', 'reviewed', 'contacted', 'closed', 'spam')),
  constraint enquiries_notification_status_check
    check (notification_status in ('pending', 'sent', 'failed')),
  constraint enquiries_full_name_length_check
    check (char_length(full_name) between 2 and 120),
  constraint enquiries_organisation_length_check
    check (organisation is null or char_length(organisation) <= 160),
  constraint enquiries_phone_length_check
    check (char_length(phone) between 7 and 40),
  constraint enquiries_email_length_check
    check (char_length(email) between 5 and 254),
  constraint enquiries_email_format_check
    check (email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  constraint enquiries_service_programme_length_check
    check (char_length(service_programme) between 2 and 160),
  constraint enquiries_programme_location_length_check
    check (programme_location is null or char_length(programme_location) <= 160),
  constraint enquiries_estimated_learners_check
    check (estimated_learners is null or estimated_learners between 1 and 100000),
  constraint enquiries_message_length_check
    check (char_length(message) between 10 and 2000),
  constraint enquiries_source_page_length_check
    check (char_length(source_page) between 1 and 300),
  constraint enquiries_ip_hash_check
    check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$'),
  constraint enquiries_user_agent_length_check
    check (user_agent is null or char_length(user_agent) <= 300),
  constraint enquiries_notification_error_length_check
    check (notification_error is null or char_length(notification_error) <= 300)
);

comment on table public.enquiries is
  'Programme enquiries submitted through the secure website endpoint.';
comment on column public.enquiries.ip_hash is
  'SHA-256 hash of the submitting IP address with a private application salt; used for abuse prevention.';

create index if not exists enquiries_created_at_idx
  on public.enquiries (created_at desc);

create index if not exists enquiries_status_created_at_idx
  on public.enquiries (status, created_at desc);

create index if not exists enquiries_email_idx
  on public.enquiries (email);

create index if not exists enquiries_ip_hash_created_at_idx
  on public.enquiries (ip_hash, created_at desc)
  where ip_hash is not null;

alter table public.enquiries enable row level security;
alter table public.enquiries force row level security;

revoke all on table public.enquiries from public;
revoke all on table public.enquiries from anon;
revoke all on table public.enquiries from authenticated;

grant usage on schema public to service_role;
grant select, insert, update on table public.enquiries to service_role;
