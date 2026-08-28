-- ============================================================
-- entidade_pedidos: standardizar a policy de staff em profiles.role
-- ============================================================
-- Contexto (LACUNA-07, docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md,
-- secção 13): o projeto tinha dois mecanismos de RBAC em paralelo em
-- profiles — "is_admin" (boolean, mais antigo) e "role" (enum
-- user/moderator/admin, acrescentado depois). A policy de staff de
-- entidade_pedidos (migration 20260823010000) usava is_admin; a de
-- reservas_alojamento (migration 20260826120000, RISCO-02) e o middleware
-- de MFA (lib/supabase/middleware.ts) já usam role. Ter os dois em
-- paralelo é uma fonte real de erro: dar role='admin' a alguém não lhe
-- dava acesso a /admin/entidades, e vice-versa.
--
-- Esta migration não apaga a coluna is_admin (pode ainda ter outros usos
-- não confirmados sem grep de árvore completa) — só troca a policy desta
-- tabela para usar "role", alinhando com o resto do projeto. Só
-- role='admin' (não 'moderator') — aprovar entidades parceiras é uma
-- ação de maior confiança do que gerir reservas de alojamento.
--
-- IMPORTANTE: depois de aplicar esta migration, o acesso a
-- /admin/entidades passa a depender de profiles.role = 'admin', não mais
-- de profiles.is_admin. Confirma que pelo menos uma conta tem role='admin'
-- (via SQL editor do Supabase: update public.profiles set role = 'admin'
-- where id = '<uuid da tua conta>') — sem isso, ninguém consegue lá
-- entrar.

drop policy if exists "Administradores gerem todos os pedidos" on "public"."entidade_pedidos";
create policy "Administradores gerem todos os pedidos" on "public"."entidade_pedidos"
  for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
