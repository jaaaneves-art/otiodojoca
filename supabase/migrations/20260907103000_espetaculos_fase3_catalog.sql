begin;
create function public.event_upcoming(p_type text default null) returns setof public.eventos
language sql stable security definer set search_path = '' as $$
 select e.* from public.eventos e where e.estado='publicado'
 and (p_type is null or p_type='' or e.tipo=p_type)
 and (e.inicio>=now() or exists(select 1 from public.event_sessions s where s.evento_id=e.id and s.starts_at>=now() and s.status in ('scheduled','sold_out')))
 order by coalesce((select min(s.starts_at) from public.event_sessions s where s.evento_id=e.id and s.starts_at>=now() and s.status in ('scheduled','sold_out')),e.inicio),e.id limit 24;
$$;
revoke all on function public.event_upcoming(text) from public;
grant execute on function public.event_upcoming(text) to anon,authenticated;
commit;
