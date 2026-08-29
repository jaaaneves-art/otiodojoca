-- ============================================================
-- entidade_pedidos.freguesia_id — coluna em falta (bug)
-- ============================================================
-- Encontrado ao construir a página de admin de revisão de pedidos
-- (docs/pendentes/RELATORIO-ENTIDADES-PARCEIRAS-20260823.md):
-- components/entidades/partner-request-form-freguesia.tsx grava
-- "freguesia_id" no insert desde 23/08 (ver comentário no próprio
-- componente e em docs/PARCEIROS-ENTRADA.md secção 2b, "liga a
-- freguesia_id (FK real)"), mas a migration
-- 20260823020000_pedidos_entidade_tipo_e_municipio.sql só acrescentou
-- "municipio_id" — "freguesia_id" nunca chegou a existir na tabela.
--
-- Efeito: TODO submit do formulário de pedido de Freguesia
-- (/parceiros/pedido/freguesia) falhava — o PostgREST rejeita o insert
-- por coluna inexistente. Ninguém conseguia pedir associação como
-- Junta de Freguesia desde que este formulário foi publicado.

alter table "public"."entidade_pedidos"
  add column if not exists "freguesia_id" bigint references public.freguesias(id) on delete set null;

create index if not exists idx_entidade_pedidos_freguesia
  on public.entidade_pedidos using btree (freguesia_id);
