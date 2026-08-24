-- ============================================================
-- Pedidos de entidade parceira — formularios individualizados por tipo
-- ============================================================
-- Ate agora "entidade_pedidos" (migration 20260823010000) tinha um unico
-- formulario generico para qualquer tipo de entidade parceira. Passamos a
-- ter formularios diferentes para Municipio, Freguesia, Outro organismo
-- publico e Outra entidade (Associacao/Cooperativa/Produtor/Empresa) — ver
-- docs/PARCEIROS-ENTRADA.md. Esta migration so acrescenta o que falta para
-- suportar isso; nada e removido nem torna-se obrigatorio para as linhas
-- ja existentes.
--
-- "tipo_entidade" discrimina qual formulario foi usado, para a futura
-- pagina de revisao de admin conseguir filtrar/mostrar os campos certos.
-- "municipio_id" e novo (FK para "municipios", tal como "freguesia_id" ja
-- referenciava "freguesias" desde a migration anterior).

alter table "public"."entidade_pedidos"
  add column if not exists "tipo_entidade" text not null default 'outro';

alter table "public"."entidade_pedidos"
  drop constraint if exists "entidade_pedidos_tipo_entidade_check";
alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_tipo_entidade_check"
  check (tipo_entidade = ANY (ARRAY['municipio'::text, 'freguesia'::text, 'organismo_publico'::text, 'outro'::text]));

alter table "public"."entidade_pedidos"
  add column if not exists "municipio_id" bigint references public.municipios(id) on delete set null;

alter table "public"."entidade_pedidos"
  add column if not exists "cargo" text;

alter table "public"."entidade_pedidos"
  add column if not exists "nipc" text;

create index if not exists idx_entidade_pedidos_tipo on public.entidade_pedidos using btree (tipo_entidade);
create index if not exists idx_entidade_pedidos_municipio on public.entidade_pedidos using btree (municipio_id);
