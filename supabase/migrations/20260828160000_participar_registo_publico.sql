-- ============================================================
-- /participar — registo institucional público (Município/Freguesia)
-- ============================================================
-- Contexto: "entidade_pedidos" (migrations 20260823010000,
-- 20260823020000, 20260826130000) já suporta pedidos de Município e
-- Freguesia, mas só para utilizadores AUTENTICADOS (profile_id
-- obrigatório, RLS só para "authenticated" com auth.uid() = profile_id).
--
-- A nova página /participar é uma porta de entrada PÚBLICA: uma Câmara
-- Municipal ou Junta de Freguesia deve poder pedir o registo sem ter de
-- criar conta primeiro (fluxo: Pessoa -> Pedido -> Validação -> Acesso
-- institucional — o acesso à plataforma, incluindo SSO institucional por
-- domínio, fica para depois da validação; ver docs/PARCEIROS-ENTRADA.md
-- secção 3 "Roadmap"). Esta migration é additiva: nada é removido, os
-- outros tipos (organismo_publico, outro, stand_automovel) continuam
-- exactamente como estavam, com os seus formulários autenticados
-- inalterados em /parceiros/pedido/*.
--
-- Reutiliza "entidade_pedidos" tal como está — não cria tabela paralela.

-- ------------------------------------------------------------
-- 1. profile_id passa a opcional
-- ------------------------------------------------------------
-- Um pedido submetido por um visitante sem sessão não tem profile_id.
-- Se a pessoa já tiver sessão (ex.: cidadão já registado a pedir em nome
-- da sua freguesia), profile_id continua a ser preenchido normalmente.
alter table "public"."entidade_pedidos"
  alter column "profile_id" drop not null;

-- ------------------------------------------------------------
-- 2. Novas colunas (todas opcionais a nível de schema — a obrigatoriedade
--    por tipo_entidade é imposta pelo trigger de validação abaixo, para
--    não afectar tipos que não passam por esta migration)
-- ------------------------------------------------------------
alter table "public"."entidade_pedidos" add column if not exists "morada" text;
alter table "public"."entidade_pedidos" add column if not exists "codigo_postal" text;
alter table "public"."entidade_pedidos" add column if not exists "localidade" text;
alter table "public"."entidade_pedidos" add column if not exists "website" text;
alter table "public"."entidade_pedidos" add column if not exists "presidente_nome" text;
alter table "public"."entidade_pedidos" add column if not exists "responsavel_nome" text;

comment on column public.entidade_pedidos.presidente_nome is
  'Nome do Presidente da Câmara/Junta — apenas o nome (minimização de dados, ver docs/PARCEIROS-ENTRADA.md).';
comment on column public.entidade_pedidos.responsavel_nome is
  'Nome da pessoa responsável operacional pela informação da entidade no OTJ. Não é a entidade nem, por definição, o Presidente.';
comment on column public.entidade_pedidos.contacto_email is
  'Email institucional da entidade. Usado para comunicações do pedido e, após validação, para o acesso institucional (SSO por domínio previsto, ainda não implementado).';

-- ------------------------------------------------------------
-- 3. Validação de obrigatoriedade + relação Município/Freguesia
-- ------------------------------------------------------------
-- Só valida os tipos servidos por /participar (municipio, freguesia) —
-- os restantes formulários (organismo_publico, outro, stand_automovel)
-- não são afectados. Corre só em INSERT: as actualizações feitas pela
-- página de admin (app/admin/entidades/actions.ts) só tocam em
-- estado/resolvido_por/resolvido_em e não devem ser revalidadas contra
-- estes campos — isso partiria a aprovação de pedidos antigos, criados
-- antes desta migration, que não têm presidente_nome/responsavel_nome.
create or replace function public.validar_entidade_pedido_participar()
returns trigger
language plpgsql
as $$
declare
  v_municipio_nome text;
  v_freguesia_municipio text;
begin
  if new.tipo_entidade not in ('municipio', 'freguesia') then
    return new;
  end if;

  -- Normalização do email institucional (trim + lowercase) — espelha a
  -- normalização já feita no cliente, mas não confia só nela.
  if new.contacto_email is not null then
    new.contacto_email := lower(btrim(new.contacto_email));
  end if;

  if new.nome_entidade is null or btrim(new.nome_entidade) = '' then
    raise exception 'nome_entidade é obrigatório.' using errcode = '23514';
  end if;

  if new.presidente_nome is null or btrim(new.presidente_nome) = '' then
    raise exception 'presidente_nome é obrigatório.' using errcode = '23514';
  end if;

  if new.responsavel_nome is null or btrim(new.responsavel_nome) = '' then
    raise exception 'responsavel_nome é obrigatório.' using errcode = '23514';
  end if;

  if new.contacto_email is null
     or new.contacto_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception 'email_institucional em formato inválido.' using errcode = '23514';
  end if;

  if new.tipo_entidade = 'municipio' then
    if new.municipio_id is null then
      raise exception 'municipio_id é obrigatório para tipo_entidade = municipio.' using errcode = '23514';
    end if;
    if new.freguesia_id is not null then
      raise exception 'Um pedido de Município não deve indicar freguesia_id.' using errcode = '23514';
    end if;

  elsif new.tipo_entidade = 'freguesia' then
    if new.freguesia_id is null then
      raise exception 'freguesia_id é obrigatório para tipo_entidade = freguesia.' using errcode = '23514';
    end if;
    if new.municipio_id is null then
      raise exception 'municipio_id é obrigatório para tipo_entidade = freguesia (necessário para validar a relação com a freguesia).' using errcode = '23514';
    end if;

    select nome into v_municipio_nome
      from public.municipios where id = new.municipio_id;
    select municipio into v_freguesia_municipio
      from public.freguesias where id = new.freguesia_id;

    if v_municipio_nome is null then
      raise exception 'Município seleccionado não existe.' using errcode = '23503';
    end if;
    if v_freguesia_municipio is null then
      raise exception 'Freguesia seleccionada não existe.' using errcode = '23503';
    end if;

    if lower(public.unaccent(v_freguesia_municipio)) <> lower(public.unaccent(v_municipio_nome)) then
      raise exception 'A freguesia seleccionada não pertence ao município seleccionado.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists entidade_pedidos_validar_participar on public.entidade_pedidos;
create trigger entidade_pedidos_validar_participar
  before insert on public.entidade_pedidos
  for each row
  execute function public.validar_entidade_pedido_participar();

-- ------------------------------------------------------------
-- 4. Anti-duplicados: no máximo um pedido pendente por entidade
-- ------------------------------------------------------------
create unique index if not exists idx_entidade_pedidos_municipio_pendente
  on public.entidade_pedidos (municipio_id)
  where tipo_entidade = 'municipio' and estado = 'pendente';

create unique index if not exists idx_entidade_pedidos_freguesia_pendente
  on public.entidade_pedidos (freguesia_id)
  where tipo_entidade = 'freguesia' and estado = 'pendente';

-- ------------------------------------------------------------
-- 5. RLS — permitir insert público (anon), só para municipio/freguesia
-- ------------------------------------------------------------
-- Utilizador autenticado: mantém-se a mesma política, agora também
-- aceitando profile_id nulo (sessão existente, mas a submeter via
-- /participar sem se identificar como requerente).
drop policy if exists "Utilizador cria o seu proprio pedido" on "public"."entidade_pedidos";
create policy "Utilizador cria o seu proprio pedido" on "public"."entidade_pedidos"
  for insert
  to authenticated
  with check (profile_id is null or auth.uid() = profile_id);

-- Visitante sem sessão: só pode criar pedidos de Município ou Freguesia
-- (os únicos tipos servidos por /participar) e nunca em nome de outra
-- conta (profile_id tem de ser nulo). Não há política de select para
-- "anon" — o pedido não pode ser relido depois de enviado, só o ecrã de
-- sucesso mostra o resumo (com os dados já em memória no browser), e os
-- dados do responsável não ficam publicamente acessíveis (ver secção 28
-- do pedido original).
drop policy if exists "Visitante cria pedido de registo institucional" on "public"."entidade_pedidos";
create policy "Visitante cria pedido de registo institucional" on "public"."entidade_pedidos"
  for insert
  to anon
  with check (profile_id is null and tipo_entidade in ('municipio', 'freguesia'));

grant insert on table "public"."entidade_pedidos" to "anon";
