-- ============================================================================
-- RPC transacional para reservas de alojamento — preço e disponibilidade
-- calculados/validados no servidor, com bloqueio contra sobreposição.
--
-- RASCUNHO PARA REVISÃO — não aplicado. Testar numa base local/staging.
--
-- Contexto (ver AUDITORIA-VALIDACAO-INDEPENDENTE-20260911.md, secção "P0 —
-- preço e disponibilidade do alojamento"): criarReservaAlojamento() em
-- lib/alojamento/actions.ts já obtém user_id da sessão (correção anterior,
-- "RISCO-02"), mas continua a gravar preco_total tal como vem do cliente,
-- e não valida sobreposição de datas nem capacidade. Esta função substitui
-- esse INSERT direto.
--
-- Decisões explícitas tomadas aqui (a confirmar convosco antes de aplicar):
--   - "capacidade" validada contra alojamentos.num_quartos (não existe
--     campo de capacidade de pessoas hoje; num_quartos é o único limite
--     estrutural no schema atual). Se quiserem limitar também por
--     num_pessoas/num_camas, isso é uma decisão de produto em aberto.
--   - a fórmula de preço replica exatamente a lógica já existente em
--     calcularPrecoReserva() (lib/alojamento/actions.ts) -- incluindo a
--     particularidade de que "meia_pensao" hoje só soma o preço do
--     almoço, não pequeno-almoço + almoço. Não alterei essa regra de
--     negócio, só a movi para o servidor; se não for intencional, é uma
--     correção à parte.
--   - disponibilidade = soma de num_quartos das reservas 'pendente' ou
--     'confirmada' que sobrepõem o intervalo pedido, comparada com
--     alojamentos.num_quartos. Não há inventário por quarto individual
--     no schema atual, por isso não se sabe QUAIS quartos ficam
--     ocupados, só a contagem -- suficiente para impedir overbooking
--     agregado, não para atribuir quartos específicos.
-- ============================================================================

create or replace function public.criar_reserva_alojamento(
  p_alojamento_id     bigint,
  p_nome_hospede      text,
  p_email_hospede     text,
  p_telefone_hospede  text,
  p_data_entrada      date,
  p_data_saida        date,
  p_num_pessoas       integer,
  p_num_quartos       integer,
  p_tipo_refeicao     text,
  p_observacoes       text
)
returns public.reservas_alojamento
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id           uuid;
  v_alojamento        public.alojamentos;
  v_noites            integer;
  v_preco_refeicoes   numeric(10,2) := 0;
  v_preco_total       numeric(10,2);
  v_quartos_ocupados  integer;
  v_reserva           public.reservas_alojamento;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'É preciso iniciar sessão para fazer uma reserva.';
  end if;

  if p_data_entrada is null or p_data_saida is null then
    raise exception 'Datas em falta.';
  end if;
  if p_data_entrada < current_date then
    raise exception 'A data de entrada não pode ser no passado.';
  end if;
  if p_data_saida <= p_data_entrada then
    raise exception 'A data de saída deve ser depois da data de entrada.';
  end if;
  if p_num_pessoas is null or p_num_pessoas <= 0 then
    raise exception 'Número de pessoas inválido.';
  end if;
  if p_num_quartos is null or p_num_quartos <= 0 then
    raise exception 'Número de quartos inválido.';
  end if;
  if p_nome_hospede is null or length(trim(p_nome_hospede)) = 0 then
    raise exception 'Nome do hóspede em falta.';
  end if;
  if p_email_hospede is null or p_email_hospede !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email do hóspede inválido.';
  end if;

  -- Serializa pedidos concorrentes para o MESMO alojamento, para que o
  -- cálculo de disponibilidade abaixo não tenha condição de corrida com
  -- outra reserva a ser criada ao mesmo tempo. Lock libertado no fim da
  -- transação.
  perform pg_advisory_xact_lock(hashtextextended('reservas_alojamento:' || p_alojamento_id::text, 0));

  select * into v_alojamento from public.alojamentos where id = p_alojamento_id;
  if not found then
    raise exception 'Alojamento não encontrado.';
  end if;

  if p_num_quartos > v_alojamento.num_quartos then
    raise exception 'Este alojamento só tem % quarto(s) no total.', v_alojamento.num_quartos;
  end if;

  select coalesce(sum(r.num_quartos), 0) into v_quartos_ocupados
    from public.reservas_alojamento r
    where r.alojamento_id = p_alojamento_id
      and r.status in ('pendente', 'confirmada')
      and r.data_entrada < p_data_saida
      and r.data_saida > p_data_entrada;

  if v_quartos_ocupados + p_num_quartos > v_alojamento.num_quartos then
    raise exception 'Não há disponibilidade suficiente para estas datas.';
  end if;

  v_noites := p_data_saida - p_data_entrada;

  if p_tipo_refeicao = 'pequeno_almoco' then
    select coalesce(preco_extra, 0) into v_preco_refeicoes
      from public.refeicoes_alojamento
      where alojamento_id = p_alojamento_id and tipo_refeicao = 'pequeno_almoco';
  elsif p_tipo_refeicao = 'meia_pensao' then
    select coalesce(preco_extra, 0) into v_preco_refeicoes
      from public.refeicoes_alojamento
      where alojamento_id = p_alojamento_id and tipo_refeicao = 'almoço';
  elsif p_tipo_refeicao = 'pensao_completa' then
    select coalesce(sum(preco_extra), 0) into v_preco_refeicoes
      from public.refeicoes_alojamento
      where alojamento_id = p_alojamento_id and tipo_refeicao in ('almoço', 'jantar');
  end if;

  v_preco_total := round((v_noites * v_alojamento.preco_noite + v_noites * coalesce(v_preco_refeicoes, 0))::numeric, 2);

  insert into public.reservas_alojamento (
    alojamento_id, user_id, nome_hospede, email_hospede, telefone_hospede,
    data_entrada, data_saida, num_pessoas, num_quartos, tipo_refeicao,
    preco_total, status, observacoes
  ) values (
    p_alojamento_id, v_user_id, p_nome_hospede, p_email_hospede, p_telefone_hospede,
    p_data_entrada, p_data_saida, p_num_pessoas, p_num_quartos, p_tipo_refeicao,
    v_preco_total, 'pendente', p_observacoes
  )
  returning * into v_reserva;

  return v_reserva;
end;
$function$;

-- "revoke ... from public" sozinho não chega neste projeto: o schema
-- base tem "alter default privileges ... grant execute on functions to
-- anon, authenticated" (ver 20260829220537_remote_schema.sql), que
-- concede EXECUTE diretamente a "anon"/"authenticated" no momento em que
-- a função é criada -- não via a pseudo-role "public". Um teste pgTAP
-- (supabase/tests/database/20260911153001_testes_reserva_alojamento_rpc.test.sql)
-- confirmou isto: sem os dois revokes nomeados abaixo, "anon" continuava
-- a poder executar esta função mesmo depois do "revoke all from public".
revoke all on function public.criar_reserva_alojamento(
  bigint, text, text, text, date, date, integer, integer, text, text
) from public, anon, authenticated;

grant execute on function public.criar_reserva_alojamento(
  bigint, text, text, text, date, date, integer, integer, text, text
) to authenticated;

-- Fecha o caminho de INSERT direto: a partir de agora, só através da RPC
-- acima (que corre como o dono da função, tipicamente sem RLS, à imagem
-- do padrão já usado por outras funções SECURITY DEFINER do projeto).
-- Isto impede que alguém contorne o cálculo de preço/disponibilidade indo
-- diretamente ao PostgREST inserir na tabela.
drop policy if exists "Reservas alojamento - criar a propria" on "public"."reservas_alojamento";

-- Rollback:
-- create policy "Reservas alojamento - criar a propria" on "public"."reservas_alojamento"
--   for insert to "authenticated" with check ((auth.uid() = user_id));
-- drop function public.criar_reserva_alojamento(bigint, text, text, text, date, date, integer, integer, text, text);
