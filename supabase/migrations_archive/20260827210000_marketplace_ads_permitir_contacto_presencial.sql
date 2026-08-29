-- ============================================================
-- MARKETPLACE_ADS — permitir "in-person" (Presencial) em contact_method
-- ============================================================
-- Encontrado ao testar o Mercado da Terra (2026-08-27): o formulário
-- (components/mercado-da-terra/ad-form.tsx) sempre ofereceu "Presencial"
-- (value="in-person") como método de contacto, mas o CHECK constraint da
-- coluna só permitia 'message'/'phone'/'email'. Ao publicar ou editar um
-- anúncio com "Presencial" selecionado, o insert/update falhava com
-- violação do constraint na base de dados. Corrigido ao alargar a lista
-- permitida.
--
-- marketplace_ads é partilhada por todos os módulos (Gran Bazar, Mercado
-- da Terra, Lup, Viaturas, Imóveis) -- confirmado que só o formulário do
-- Mercado da Terra oferece esta opção neste momento, mas passa a estar
-- disponível para qualquer módulo que venha a querer usá-la.
alter table "public"."marketplace_ads"
  drop constraint if exists "marketplace_ads_contact_method_check";

alter table "public"."marketplace_ads"
  add constraint "marketplace_ads_contact_method_check"
  check ((contact_method = ANY (ARRAY['message'::text, 'phone'::text, 'email'::text, 'in-person'::text])));
