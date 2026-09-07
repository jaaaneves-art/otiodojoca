begin;

create policy "eventos_org_insert"
on public.eventos
for insert
to authenticated
with check (
  entidade_organizadora_id is not null
  and public.is_event_org_member(
    entidade_organizadora_id,
    array['owner','admin','manager']::text[]
  )
);

create policy "eventos_org_update"
on public.eventos
for update
to authenticated
using (
  public.is_event_org_member(
    entidade_organizadora_id,
    array['owner','admin','manager']::text[]
  )
)
with check (
  public.is_event_org_member(
    entidade_organizadora_id,
    array['owner','admin','manager']::text[]
  )
);

create policy "eventos_org_delete"
on public.eventos
for delete
to authenticated
using (
  estado = 'rascunho'
  and public.is_event_org_member(
    entidade_organizadora_id,
    array['owner','admin']::text[]
  )
);

create policy "eventos_org_read"
on public.eventos
for select
to authenticated
using (
  public.is_event_org_member(
    entidade_organizadora_id,
    array['owner','admin','manager','checkin','finance']::text[]
  )
);

grant insert, update, delete on public.eventos to authenticated;
grant usage, select on sequence public.eventos_id_seq to authenticated;

create policy "entidades_event_org_read"
on public.entidades
for select
to authenticated
using (
  public.is_event_org_member(id, null)
);

commit;
