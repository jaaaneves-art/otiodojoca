-- Fase F — ponte entre `entidades` (genérica, usada pelas páginas de
-- Freguesia) e os módulos verticais especializados (restaurantes,
-- alojamentos, comercios). Decisão de 13/09/2026: FK no sentido inverso
-- (vertical.entity_id -> entidades.id), não usar as colunas
-- entidades.ref_tabela/ref_id já existentes (tipo incompatível: ref_id é
-- uuid, os verticais usam bigint exceto comercios que é uuid mas por
-- coincidência de estilo, não por desenho). Nullable e aditivo — não
-- altera nem quebra nada do que já existe. Campos duplicados (nome,
-- telefone, email, website) ficam duplicados por agora, por decisão
-- explícita (ver docs/pendentes/CHECKLIST-20260910-FREGUESIA-GRUPOS.md e
-- docs/planos/20260913T0945-plano-sessao.md, secção "P2 — Fase F").
-- Backfill das linhas já existentes (7 restaurantes + 9 alojamentos) fica
-- por fazer — exige mapear freguesia_id/categoria_id linha a linha, não é
-- coisa para inferir às cegas.

alter table public.restaurantes
  add column if not exists entity_id bigint references public.entidades(id) on delete set null;
create unique index if not exists restaurantes_entity_id_key
  on public.restaurantes(entity_id) where entity_id is not null;

alter table public.alojamentos
  add column if not exists entity_id bigint references public.entidades(id) on delete set null;
create unique index if not exists alojamentos_entity_id_key
  on public.alojamentos(entity_id) where entity_id is not null;

alter table public.comercios
  add column if not exists entity_id bigint references public.entidades(id) on delete set null;
create unique index if not exists comercios_entity_id_key
  on public.comercios(entity_id) where entity_id is not null;
