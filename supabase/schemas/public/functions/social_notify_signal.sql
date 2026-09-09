create or replace function public.social_notify_signal(p_user uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.social_realtime_state(user_id, revision) values (p_user, 1)
  on conflict (user_id) do update set revision = public.social_realtime_state.revision + 1;
$$;
revoke all on function public.social_notify_signal(uuid) from public, anon, authenticated;
grant execute on function public.social_notify_signal(uuid) to service_role;
