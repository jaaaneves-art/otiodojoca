-- ============================================================
-- StandGo — Stands verificados podem contactar-se diretamente
-- ============================================================
-- Pedido do Yos (28/08/2026): "vai ser possivel os comerciantes negociar
-- e contactarem entre eles. O registo é feito a nivel empresarial... quando
-- o código de actividade... for relacionado com os automoveis já sabemos
-- que ele pode comunicar com os outros dentro da plataforma".
--
-- Fica esclarecido em conversa (ver claude/... no projeto Claude "otj"):
-- - O "código de atividade" é o CAE (Finanças/IRN) -- sem API pública
--   fiável, por isso é inserido manualmente no pedido de associação.
--   NÃO é uma automação total: o admin que aprova o pedido continua a
--   ser o "gate" de confiança (mesmo modelo já usado para Município/
--   Freguesia/Organismo público), só que agora vê o CAE e um aviso
--   quando parece ser um comerciante automóvel.
-- - "Comunicar entre eles" = extensão do sistema de mensagens que já
--   existe (marketplace_conversations/marketplace_messages), não uma
--   área B2B nova -- só passa a permitir uma conversa SEM anúncio
--   associado, entre dois stands verificados.
-- - Este registo empresarial usa o fluxo /parceiros já existente, com
--   "Stand Automóvel" como um novo tipo de entidade dedicado (ao lado
--   de Município/Freguesia/Organismo público/Outra entidade) -- não é
--   um fluxo novo à parte, dedicado só ao StandGo.
--
-- SSO institucional por domínio (Google Workspace/Microsoft 365)
-- continua por fazer -- ver docs/pendentes/OAUTH-SOCIAL-LOGIN-20260828.md
-- e o roadmap original em docs/PARCEIROS-ENTRADA.md. Esta migration não
-- mexe nisso; a aprovação continua a ser manual, por password.

-- 1) "Stand Automóvel" como novo tipo de entidade dedicado (a par de
--    municipio/freguesia/organismo_publico/outro -- ver migration
--    20260823020000_pedidos_entidade_tipo_e_municipio.sql).
alter table "public"."entidade_pedidos"
  drop constraint if exists "entidade_pedidos_tipo_entidade_check";
alter table "public"."entidade_pedidos"
  add constraint "entidade_pedidos_tipo_entidade_check"
  check (tipo_entidade = ANY (ARRAY['municipio'::text, 'freguesia'::text, 'organismo_publico'::text, 'outro'::text, 'stand_automovel'::text]));

-- CAE no pedido de entidade -- opcional, texto livre (não há tabela de
-- referência fiável dos CAE em Portugal disponível para validar aqui).
alter table "public"."entidade_pedidos"
  add column if not exists "codigo_atividade" text;

-- 2) Flag no perfil -- só passa a true quando um admin aprova um pedido
--    cujo CAE começa por "45" (CAE-Rev.3, Secção G, Divisão 45:
--    "Comércio, manutenção e reparação, de veículos automóveis e
--    motociclos"). Sem grant de UPDATE para "authenticated" -- mesmo
--    padrão da coluna "role": só postgres/service_role podem escrever
--    aqui (ver app/admin/entidades/actions.ts, que usa
--    lib/supabase/admin.ts para este write específico).
alter table "public"."profiles"
  add column if not exists "is_stand_automovel" boolean not null default false;

create index if not exists idx_profiles_stand_automovel
  on public.profiles using btree (is_stand_automovel)
  where is_stand_automovel = true;

-- 3) marketplace_conversations passa a suportar conversas SEM anúncio
--    associado (contacto direto entre dois stands verificados, "fora do
--    fluxo normal comprador->vendedor" -- pedido explícito do Yos).
--
--    "module" é novo: para conversas ligadas a um anúncio continua a
--    dar para saber o módulo através de marketplace_ads.module (o
--    backfill abaixo só preenche por completude/consistência); para
--    conversas diretas (ad_id null) é a ÚNICA forma de saber a que
--    módulo pertencem, por isso as páginas de mensagens de cada módulo
--    (ex: app/viaturas/mensagens/page.tsx) passam a filtrar também por
--    "ad_id is null and module = '<modulo>'", já não só pelo ad_id.
alter table "public"."marketplace_conversations"
  add column if not exists "module" text;

update public.marketplace_conversations c
  set module = a.module
  from public.marketplace_ads a
  where c.ad_id = a.id and c.module is null;

alter table "public"."marketplace_conversations"
  alter column "ad_id" drop not null;

-- Um par de stands só pode ter UMA conversa direta (ad_id null) entre
-- si, independentemente de quem contacta primeiro -- least/greatest
-- normaliza a ordem do par para a comparação. A unicidade antiga
-- (ad_id, buyer_id) mantém-se intacta para conversas com anúncio.
create unique index if not exists idx_conversations_par_direto
  on public.marketplace_conversations (least(buyer_id, seller_id), greatest(buyer_id, seller_id))
  where ad_id is null;
