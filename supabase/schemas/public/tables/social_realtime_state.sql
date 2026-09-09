create table public.social_realtime_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  revision bigint not null default 1
);
alter table public.social_realtime_state enable row level security;
revoke all on public.social_realtime_state from public, anon, authenticated;
grant select on public.social_realtime_state to authenticated;
grant all on public.social_realtime_state to service_role;
create policy "social realtime owner" on public.social_realtime_state
for select to authenticated using (user_id = auth.uid());
