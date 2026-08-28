-- RISCO-02 (docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md):
-- reservas_alojamento tinha RLS totalmente aberta (USING(true)/WITH
-- CHECK(true) para PUBLIC, incluindo "anon") -- qualquer pessoa com a
-- chave publicável do Supabase conseguia ler o nome/email/telefone de
-- todos os hóspedes e alterar o estado de qualquer reserva, diretamente
-- via REST, sem passar pela app.
--
-- Decisão de produto: como o acesso à página de reserva já exige sessão
-- (lib/supabase/middleware.ts), a reserva passa a ficar ligada ao
-- utilizador autenticado que a criou (user_id), em vez de continuar
-- anónima. Sem "OR user_id IS NULL" -- ao contrário de
-- restaurante_reservas, este módulo não tem hoje um caminho de reserva
-- sem sessão, por isso não se abre essa exceção aqui.
--
-- "Staff" (moderator/admin) continua a poder ver/gerir todas as reservas,
-- seguindo o único precedente existente no projeto para RLS admin-only
-- (supabase/schemas/public/tables/audit_log.sql, profiles.role = 'admin').

alter table "public"."reservas_alojamento"
  add column "user_id" uuid references auth.users(id) on delete cascade;

create index idx_reservas_alojamento_user_id
  on public.reservas_alojamento using btree (user_id);

drop policy if exists "Reservas - INSERT para todos" on "public"."reservas_alojamento";
drop policy if exists "Reservas - SELECT públicas" on "public"."reservas_alojamento";
drop policy if exists "Reservas - UPDATE próprias" on "public"."reservas_alojamento";

create policy "Reservas alojamento - criar a propria" on "public"."reservas_alojamento"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Reservas alojamento - ver propria ou staff" on "public"."reservas_alojamento"
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  );

create policy "Reservas alojamento - editar propria ou staff" on "public"."reservas_alojamento"
  for update
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  )
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('moderator', 'admin')
    )
  );

-- Sem policy de DELETE (mantém-se assim -- já não era possível apagar
-- antes desta migration, RLS bloqueava por omissão).

revoke all on table "public"."reservas_alojamento" from "anon";
revoke all on table "public"."reservas_alojamento" from "authenticated";
grant select, insert, update on table "public"."reservas_alojamento" to "authenticated";
