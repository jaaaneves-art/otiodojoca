create table public.social_media_cleanup_jobs (
  storage_key text primary key,
  reason text not null check (reason in ('abandoned','orphan','retention')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  attempts integer not null default 0,
  last_attempt_at timestamptz
);
alter table public.social_media_cleanup_jobs enable row level security;
revoke all on public.social_media_cleanup_jobs from public, anon, authenticated;
grant select, insert, update on public.social_media_cleanup_jobs to service_role;
create index social_media_cleanup_pending on public.social_media_cleanup_jobs(created_at)
  where completed_at is null;
