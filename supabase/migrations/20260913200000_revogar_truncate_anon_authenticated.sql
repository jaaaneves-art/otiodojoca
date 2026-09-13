-- Revoga TRUNCATE de anon/authenticated em todo o schema public.
--
-- Descoberto ao investigar o "GRANT TRUNCATE indevido" registado em
-- docs/pendentes/PENDENTES-20260913.md (P0 1b): quase todas as ~190
-- tabelas de public tinham TRUNCATE concedido tanto a anon como a
-- authenticated. Não é um erro deste projeto -- é o comportamento por
-- omissão antigo do próprio Supabase (tabelas novas ficam com SELECT/
-- INSERT/UPDATE/DELETE concedidos automaticamente a anon/authenticated/
-- service_role; o Supabase confirma na sua documentação que estão a
-- mudar este default e já recomendam reverter -- ver
-- https://github.com/orgs/supabase/discussions/45329).
--
-- TRUNCATE em concreto nunca passa pela RLS (nenhuma policy o filtra,
-- ao contrário de SELECT/INSERT/UPDATE/DELETE) e nenhuma
-- funcionalidade da app alguma vez emite um TRUNCATE -- revogar é
-- risco zero.
--
-- Fica fora desta migration, por decisão do Yos (mudança maior, exige
-- rever tabela a tabela): o mesmo padrão em INSERT/UPDATE/DELETE, onde
-- "anon" tem essas permissões em ~90 tabelas e a RLS é a única linha
-- de defesa.

BEGIN;

REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- Para tabelas novas não voltarem a herdar TRUNCATE automaticamente.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE ON TABLES FROM anon, authenticated;

COMMIT;
