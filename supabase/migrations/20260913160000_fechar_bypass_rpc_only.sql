-- Fecha um bypass real das policies "RPC-only" aplicadas hoje mais cedo
-- (commit 91700ec, migrations 20260913020000/20260913030000/20260913040000).
-- Essas migrations criaram policies novas com WITH CHECK/USING (false)
-- para bloquear escrita direta, mas nunca apagaram as policies antigas
-- que ainda permitiam escrita direta nas mesmas tabelas. No Postgres,
-- policies PERMISSIVE para o mesmo comando são combinadas com OR — basta
-- UMA dar true para passar. Confirmado ao vivo (testes em transação,
-- sempre revertidos/apagados, sem tocar em dados reais):
--   - jobs: uma empresa NÃO aprovada conseguia publicar uma vaga direto,
--     sem passar por job_criar() nem pela validação estado='aprovado'.
--   - restaurante_reservas: INSERT/UPDATE/DELETE direto continuavam a
--     funcionar.
--   - reservas_alojamento: só o UPDATE tinha o problema (o INSERT já
--     tinha sido corretamente fechado em 20260911153000).
--
-- marketplace_ads TAMBÉM tem este problema mas fica de fora desta
-- migration -- ver nota separada em docs/planos (precisa primeiro de
-- alargar marketplace_ad_editar() e migrar 4 ficheiros de app/lib que
-- ainda fazem UPDATE/DELETE direto, para não partir produção).
--
-- Verificado por grep em app/ e lib/ antes de aplicar: nenhum destes 3
-- casos tem código vivo a depender da policy que está a ser removida.
--   - restaurante_reservas: só existe "criar reserva" na app (já usa a
--     RPC restaurante_reserva_criar); não há editar/cancelar nenhures.
--   - jobs: nenhuma escrita direta em app/ nem lib/ (só um cron que lê).
--   - reservas_alojamento: atualizarStatusReserva()/cancelarReserva()
--     em lib/alojamento/actions.ts nunca são chamadas por nenhuma
--     página/componente (código morto, confirmado por grep).

BEGIN;

-- ----------------------------------------------------------------------
-- restaurante_reservas — fechar de vez (só fica a RPC de criação)
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Cancelar sua reserva" ON public.restaurante_reservas;
DROP POLICY IF EXISTS "Criar reserva com user_id" ON public.restaurante_reservas;
DROP POLICY IF EXISTS "Editar sua reserva" ON public.restaurante_reservas;
-- "Utilizador vê suas reservas" (SELECT) e as 3 policies "restaurante_
-- reservas_{insert,update,delete}" (false) ficam como estão.

-- ----------------------------------------------------------------------
-- jobs — troca as 2 policies ALL por SELECT-only (mantém leitura,
-- fecha escrita direta; escrita passa a ser só via job_criar/_editar/
-- job_publicar/_pausar/_fechar/_reabrir, que são SECURITY DEFINER e por
-- isso não passam pela RLS)
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Empresa gere as suas vagas" ON public.jobs;
CREATE POLICY "Empresa ve as suas vagas" ON public.jobs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.empregos_empresas ee
    WHERE ee.id = jobs.empresa_id AND ee.profile_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Administradores gerem todas as vagas" ON public.jobs;
CREATE POLICY "Administradores veem todas as vagas" ON public.jobs
  FOR SELECT
  USING (public.e_admin());

-- jobs_insert/_update/_delete (false) ficam como estão.

-- ----------------------------------------------------------------------
-- reservas_alojamento — fecha o UPDATE (o INSERT já estava bem)
-- ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Reservas alojamento - editar propria ou staff" ON public.reservas_alojamento;
-- "Reservas alojamento - ver propria ou staff" (SELECT, policy
-- separada) e reservas_alojamento_{insert,update} (false) ficam como
-- estão.

COMMIT;
