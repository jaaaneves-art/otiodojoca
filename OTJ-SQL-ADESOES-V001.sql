-- ============================================================
-- OTJ — CAMADA GENÉRICA DE ADESÕES
-- Ficheiro : OTJ-SQL-ADESOES-V001.sql
-- Versão   : 1.0
-- Âmbito   : Educação, Escutismo, Universidades, Freguesia
-- Modelo   : pedido | convite  →  aprovação por moderador
--            (+ aprovação de tutor quando o titular é menor)
-- ============================================================
--
-- EXECUÇÃO (NUNCA pelo SQL Editor — bloqueia em silêncio no DDL):
--   psql "$SUPA_URL" -v ON_ERROR_STOP=1 -f OTJ-SQL-ADESOES-V001.sql
--   (porta 5432 direta, não o pooler 6543)
--
-- ------------------------------------------------------------
-- PRÉ-VERIFICAÇÃO OBRIGATÓRIA antes de correr este ficheiro
-- ------------------------------------------------------------
-- Este schema assume que public.profiles.id === auth.users.id.
-- Confirmar com:
--
--   SELECT column_name, data_type
--     FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='profiles'
--    ORDER BY ordinal_position;
--
--   SELECT count(*) AS profiles_sem_user
--     FROM public.profiles p
--     LEFT JOIN auth.users u ON u.id = p.id
--    WHERE u.id IS NULL;   -- tem de dar 0
--
-- Se profiles.id NÃO for igual a auth.users.id (ex.: existir uma
-- coluna profiles.user_id separada), PARAR e ajustar todas as
-- comparações `= auth.uid()` deste ficheiro antes de executar.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ENUMS
-- ============================================================
-- CREATE TYPE não aceita IF NOT EXISTS — guardar em DO block.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adesao_origem') THEN
    CREATE TYPE public.adesao_origem AS ENUM ('pedido', 'convite');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adesao_estado') THEN
    CREATE TYPE public.adesao_estado AS ENUM (
      'pendente',    -- à espera de aprovação (moderador e/ou tutor)
      'aprovada',    -- todas as aprovações necessárias reunidas
      'recusada',    -- moderador ou tutor recusou
      'cancelada',   -- o próprio titular desistiu / saiu do grupo
      'expirada'     -- convite não respondido dentro do prazo
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grupo_nivel_moderacao') THEN
    CREATE TYPE public.grupo_nivel_moderacao AS ENUM ('admin', 'moderador');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tutoria_estado') THEN
    CREATE TYPE public.tutoria_estado AS ENUM ('pendente', 'confirmada', 'revogada');
  END IF;
END
$$;

-- ============================================================
-- 2. CONFIGURAÇÃO DA PLATAFORMA
-- ============================================================
-- A idade a partir da qual NÃO é exigida aprovação do tutor está
-- aqui, e não espalhada pelo código, porque a decisão 16 vs 18
-- continua em aberto. Mudar o valor não exige DDL nem deploy.

CREATE TABLE IF NOT EXISTS public.config_plataforma (
  chave       text PRIMARY KEY,
  valor       jsonb       NOT NULL,
  descricao   text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.config_plataforma (chave, valor, descricao)
VALUES (
  'idade_adulto_adesoes',
  '18'::jsonb,
  'Idade a partir da qual uma adesão dispensa aprovação de tutor. DECISÃO PROVISÓRIA: 18. Alternativa em discussão: 16.'
)
ON CONFLICT (chave) DO NOTHING;

-- ============================================================
-- 3. REGISTO CENTRAL DE GRUPOS
-- ============================================================
-- Um grupo é qualquer coisa a que uma pessoa possa aderir:
-- escola, agrupamento escolar, agrupamento de escuteiros,
-- associação de estudantes, núcleo universitário, associação
-- da freguesia...
--
-- Existe para que `adesoes.grupo_id` possa ter uma FK REAL.
-- A alternativa (entidade_tipo + entidade_id polimórfico) não
-- permite integridade referencial e acaba sempre com órfãos.
-- Cada módulo aponta a sua tabela para aqui via grupo_id.

CREATE TABLE IF NOT EXISTS public.grupos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  modulo      text NOT NULL,   -- 'educacao' | 'escutismo' | 'universidades' | 'freguesia'
  tipo        text NOT NULL,   -- 'escola' | 'agrupamento' | 'infantario' | 'associacao' | ...
  nome        text NOT NULL,

  -- Papéis que este grupo aceita em adesões.
  -- Ex.: escola → {professor, profissional, estudante, encarregado}
  papeis_permitidos text[] NOT NULL DEFAULT '{}',

  -- Um pedido espontâneo (origem='pedido') é aceite?
  -- Se false, só se entra por convite de um moderador.
  aceita_pedidos boolean NOT NULL DEFAULT true,

  ativo       boolean NOT NULL DEFAULT true,
  criado_por  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT grupos_nome_nao_vazio CHECK (length(trim(nome)) > 0),
  CONSTRAINT grupos_papeis_nao_vazio CHECK (cardinality(papeis_permitidos) > 0)
);

CREATE INDEX IF NOT EXISTS idx_grupos_modulo ON public.grupos(modulo);
CREATE INDEX IF NOT EXISTS idx_grupos_tipo   ON public.grupos(tipo);
CREATE INDEX IF NOT EXISTS idx_grupos_ativo  ON public.grupos(ativo) WHERE ativo;

-- ============================================================
-- 4. MODERADORES DO GRUPO
-- ============================================================
-- Quem aprova as adesões. 'admin' pode gerir outros moderadores;
-- 'moderador' só aprova/recusa adesões.

CREATE TABLE IF NOT EXISTS public.grupos_moderadores (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id   uuid NOT NULL REFERENCES public.grupos(id)   ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nivel      public.grupo_nivel_moderacao NOT NULL DEFAULT 'moderador',

  criado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (grupo_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_grupos_moderadores_grupo   ON public.grupos_moderadores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_grupos_moderadores_profile ON public.grupos_moderadores(profile_id);

-- Garantir que um grupo nunca fica sem admin: impedir a remoção do último.
CREATE OR REPLACE FUNCTION public.impedir_remocao_ultimo_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restantes integer;
BEGIN
  IF OLD.nivel <> 'admin' THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO v_restantes
    FROM public.grupos_moderadores
   WHERE grupo_id = OLD.grupo_id
     AND nivel = 'admin'
     AND id <> OLD.id;

  IF v_restantes = 0 THEN
    RAISE EXCEPTION 'Não é possível remover o último administrador do grupo %', OLD.grupo_id
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_remocao_ultimo_admin ON public.grupos_moderadores;
CREATE TRIGGER trg_impedir_remocao_ultimo_admin
  BEFORE DELETE ON public.grupos_moderadores
  FOR EACH ROW EXECUTE FUNCTION public.impedir_remocao_ultimo_admin();

-- ============================================================
-- 5. TUTORIAS (encarregados de educação)
-- ============================================================
-- ATENÇÃO: se o módulo Escutismo já criou uma tabela de tutores,
-- NÃO executar esta secção — migrar essa tabela para aqui.
-- Verificar antes com:
--   \dt public.*tutor*
--   \dt public.*encarregado*

CREATE TABLE IF NOT EXISTS public.tutorias (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menor_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  relacao   text,  -- 'pai' | 'mae' | 'tutor_legal' | 'outro'
  estado    public.tutoria_estado NOT NULL DEFAULT 'pendente',

  confirmada_em timestamptz,
  revogada_em   timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (tutor_profile_id, menor_profile_id),
  CONSTRAINT tutoria_nao_reflexiva CHECK (tutor_profile_id <> menor_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_tutorias_menor ON public.tutorias(menor_profile_id)
  WHERE estado = 'confirmada';
CREATE INDEX IF NOT EXISTS idx_tutorias_tutor ON public.tutorias(tutor_profile_id)
  WHERE estado = 'confirmada';

-- ============================================================
-- 6. ADESÕES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.adesoes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  grupo_id   uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,

  -- NULL apenas enquanto um convite por email não foi convertido.
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,

  papel      text NOT NULL,   -- validado contra grupos.papeis_permitidos
  origem     public.adesao_origem NOT NULL,
  estado     public.adesao_estado NOT NULL DEFAULT 'pendente',

  -- --- dupla aprovação ---
  requer_aprovacao_tutor boolean NOT NULL DEFAULT false,

  aprovado_moderador_em  timestamptz,
  aprovado_moderador_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  aprovado_tutor_em      timestamptz,
  aprovado_tutor_por     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- --- recusa ---
  recusado_em   timestamptz,
  recusado_por  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  motivo_recusa text,

  -- Quem iniciou: o próprio (pedido) ou um moderador (convite)
  iniciado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Campos específicos do módulo: disciplinas, ano de frequência,
  -- secção do agrupamento, etc.
  dados_adicionais jsonb NOT NULL DEFAULT '{}',

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Uma pessoa não pode ter duas adesões vivas ao mesmo grupo com o
-- mesmo papel. Índice parcial: adesões recusadas/canceladas antigas
-- não bloqueiam uma nova tentativa.
CREATE UNIQUE INDEX IF NOT EXISTS uq_adesao_viva
  ON public.adesoes (grupo_id, profile_id, papel)
  WHERE profile_id IS NOT NULL
    AND estado IN ('pendente', 'aprovada');

CREATE INDEX IF NOT EXISTS idx_adesoes_grupo   ON public.adesoes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_adesoes_profile ON public.adesoes(profile_id);
CREATE INDEX IF NOT EXISTS idx_adesoes_estado  ON public.adesoes(estado);
CREATE INDEX IF NOT EXISTS idx_adesoes_pendentes_grupo
  ON public.adesoes(grupo_id) WHERE estado = 'pendente';

-- ============================================================
-- 7. CONVITES POR EMAIL (pessoa ainda sem conta OTJ)
-- ============================================================
-- O token é guardado APENAS em hash. O valor em claro é devolvido
-- uma única vez, no momento da criação, para ir no email.

CREATE TABLE IF NOT EXISTS public.adesoes_convites_email (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  papel    text NOT NULL,

  email_normalizado text NOT NULL,   -- lower(trim(email))
  token_hash        text NOT NULL UNIQUE,

  expira_em    timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  consumido_em timestamptz,

  -- Preenchido na conversão: o convite passa a ser uma adesão real
  adesao_id  uuid REFERENCES public.adesoes(id) ON DELETE SET NULL,

  criado_por uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dados_adicionais jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT convite_email_valido CHECK (email_normalizado ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- Um convite pendente por (grupo, email, papel).
CREATE UNIQUE INDEX IF NOT EXISTS uq_convite_email_pendente
  ON public.adesoes_convites_email (grupo_id, email_normalizado, papel)
  WHERE consumido_em IS NULL;

CREATE INDEX IF NOT EXISTS idx_convites_email ON public.adesoes_convites_email(email_normalizado)
  WHERE consumido_em IS NULL;

-- ============================================================
-- 8. FUNÇÕES AUXILIARES (SECURITY DEFINER)
-- ============================================================
-- Estas funções são SECURITY DEFINER de propósito: as políticas RLS
-- de `adesoes` precisam de consultar `grupos_moderadores` e
-- `tutorias`, e as políticas dessas tabelas precisam de consultar
-- `adesoes`. Sem o corte por SECURITY DEFINER isso é um ciclo de
-- recursão que o Postgres resolve com deny-all silencioso.
-- (Já aconteceu duas vezes neste projeto. É regra permanente.)

CREATE OR REPLACE FUNCTION public.e_moderador_grupo(p_grupo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.grupos_moderadores
     WHERE grupo_id = p_grupo_id
       AND profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.e_admin_grupo(p_grupo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.grupos_moderadores
     WHERE grupo_id = p_grupo_id
       AND profile_id = auth.uid()
       AND nivel = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.e_tutor_confirmado_de(p_menor_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.tutorias
     WHERE menor_profile_id = p_menor_profile_id
       AND tutor_profile_id = auth.uid()
       AND estado = 'confirmada'
  );
$$;

-- Idade configurável (16 vs 18 ainda por decidir).
CREATE OR REPLACE FUNCTION public.idade_adulto_adesoes()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT (valor #>> '{}')::integer
       FROM public.config_plataforma
      WHERE chave = 'idade_adulto_adesoes'),
    18
  );
$$;

-- É menor?  Sem data de nascimento conhecida → assume-se menor.
-- Falhar para o lado seguro é deliberado: é preferível pedir uma
-- aprovação de tutor a mais do que inscrever um menor sem ela.
CREATE OR REPLACE FUNCTION public.e_menor(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_nascimento date;
  v_tem_coluna  boolean;
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN true;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'profiles'
       AND column_name = 'data_nascimento'
  ) INTO v_tem_coluna;

  IF NOT v_tem_coluna THEN
    -- profiles ainda não guarda data de nascimento.
    RETURN true;
  END IF;

  EXECUTE 'SELECT data_nascimento FROM public.profiles WHERE id = $1'
    INTO v_nascimento USING p_profile_id;

  IF v_nascimento IS NULL THEN
    RETURN true;
  END IF;

  RETURN age(v_nascimento) < make_interval(years => public.idade_adulto_adesoes());
END;
$$;

-- ============================================================
-- 9. TRIGGERS DE INTEGRIDADE DAS ADESÕES
-- ============================================================

-- 9.1 Validar papel + calcular se precisa de tutor
CREATE OR REPLACE FUNCTION public.adesao_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_papeis text[];
  v_ativo  boolean;
BEGIN
  SELECT papeis_permitidos, ativo INTO v_papeis, v_ativo
    FROM public.grupos WHERE id = NEW.grupo_id;

  IF v_papeis IS NULL THEN
    RAISE EXCEPTION 'Grupo % não existe', NEW.grupo_id;
  END IF;

  IF NOT v_ativo THEN
    RAISE EXCEPTION 'Grupo % está inativo e não aceita novas adesões', NEW.grupo_id;
  END IF;

  IF NOT (NEW.papel = ANY (v_papeis)) THEN
    RAISE EXCEPTION 'Papel "%" não é permitido neste grupo. Permitidos: %',
      NEW.papel, array_to_string(v_papeis, ', ');
  END IF;

  -- Dupla aprovação: exigida sempre que o titular for menor.
  NEW.requer_aprovacao_tutor := public.e_menor(NEW.profile_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adesao_before_insert ON public.adesoes;
CREATE TRIGGER trg_adesao_before_insert
  BEFORE INSERT ON public.adesoes
  FOR EACH ROW EXECUTE FUNCTION public.adesao_before_insert();

-- 9.2 Passar a 'aprovada' só quando TODAS as aprovações estiverem reunidas
CREATE OR REPLACE FUNCTION public.adesao_resolver_estado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();

  -- Recusa vence sempre.
  IF NEW.recusado_em IS NOT NULL THEN
    NEW.estado := 'recusada';
    RETURN NEW;
  END IF;

  IF NEW.estado IN ('cancelada', 'expirada') THEN
    RETURN NEW;
  END IF;

  IF NEW.aprovado_moderador_em IS NOT NULL
     AND (NEW.requer_aprovacao_tutor = false OR NEW.aprovado_tutor_em IS NOT NULL)
  THEN
    NEW.estado := 'aprovada';
  ELSE
    NEW.estado := 'pendente';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adesao_resolver_estado ON public.adesoes;
CREATE TRIGGER trg_adesao_resolver_estado
  BEFORE UPDATE ON public.adesoes
  FOR EACH ROW EXECUTE FUNCTION public.adesao_resolver_estado();

-- ============================================================
-- 10. RPC — FLUXOS DE ADESÃO
-- ============================================================
-- Toda a escrita em `adesoes` passa por aqui. As políticas RLS de
-- UPDATE são deliberadamente restritivas para que a aprovação não
-- possa ser forjada por um UPDATE direto do cliente.

-- 10.1 PEDIDO — a pessoa pede para entrar
CREATE OR REPLACE FUNCTION public.adesao_pedir(
  p_grupo_id uuid,
  p_papel    text,
  p_dados    jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_aceita boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  SELECT aceita_pedidos INTO v_aceita FROM public.grupos WHERE id = p_grupo_id;
  IF v_aceita IS NULL THEN
    RAISE EXCEPTION 'Grupo não encontrado';
  END IF;
  IF NOT v_aceita THEN
    RAISE EXCEPTION 'Este grupo só aceita entradas por convite';
  END IF;

  INSERT INTO public.adesoes (grupo_id, profile_id, papel, origem, iniciado_por, dados_adicionais)
  VALUES (p_grupo_id, auth.uid(), p_papel, 'pedido', auth.uid(), p_dados)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 10.2 CONVITE POR USERNAME — moderador convida quem já tem conta
CREATE OR REPLACE FUNCTION public.adesao_convidar_username(
  p_grupo_id uuid,
  p_username text,
  p_papel    text,
  p_dados    jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid;
  v_id uuid;
BEGIN
  IF NOT public.e_moderador_grupo(p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas moderadores do grupo podem convidar';
  END IF;

  SELECT id INTO v_profile_id
    FROM public.profiles
   WHERE lower(username) = lower(trim(p_username));

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Não existe nenhum utilizador com o username "%"', p_username;
  END IF;

  INSERT INTO public.adesoes (grupo_id, profile_id, papel, origem, iniciado_por, dados_adicionais)
  VALUES (p_grupo_id, v_profile_id, p_papel, 'convite', auth.uid(), p_dados)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 10.3 CONVITE POR EMAIL — pessoa ainda sem conta
-- Devolve o token em claro UMA ÚNICA VEZ (para o email do SendGrid).
-- Em base de dados fica só o hash.
CREATE OR REPLACE FUNCTION public.adesao_convidar_email(
  p_grupo_id uuid,
  p_email    text,
  p_papel    text,
  p_dados    jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (convite_id uuid, token text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp, extensions
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_token text;
  v_id    uuid;
  v_profile_existente uuid;
BEGIN
  IF NOT public.e_moderador_grupo(p_grupo_id) THEN
    RAISE EXCEPTION 'Apenas moderadores do grupo podem convidar';
  END IF;

  -- Se o email já corresponde a uma conta, o convite é direto —
  -- não faz sentido mandar um token de registo a quem já se registou.
  SELECT id INTO v_profile_existente FROM auth.users WHERE lower(email) = v_email;
  IF v_profile_existente IS NOT NULL THEN
    RAISE EXCEPTION 'Este email já tem conta OTJ. Convidar pelo username.'
      USING HINT = 'Usar adesao_convidar_username()';
  END IF;

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.adesoes_convites_email
    (grupo_id, papel, email_normalizado, token_hash, criado_por, dados_adicionais)
  VALUES
    (p_grupo_id, p_papel, v_email, encode(digest(v_token, 'sha256'), 'hex'), auth.uid(), p_dados)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_token;
END;
$$;

-- 10.4 CONVERSÃO — chamado depois do registo, com o token do email
CREATE OR REPLACE FUNCTION public.convite_email_converter(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp, extensions
AS $$
DECLARE
  v_convite public.adesoes_convites_email%ROWTYPE;
  v_adesao_id uuid;
  v_email_utilizador text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária';
  END IF;

  SELECT * INTO v_convite
    FROM public.adesoes_convites_email
   WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex');

  IF v_convite.id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido';
  END IF;
  IF v_convite.consumido_em IS NOT NULL THEN
    RAISE EXCEPTION 'Convite já utilizado';
  END IF;
  IF v_convite.expira_em < now() THEN
    RAISE EXCEPTION 'Convite expirado';
  END IF;

  -- O convite é para um email específico: só o dono desse email o consome.
  SELECT lower(email) INTO v_email_utilizador FROM auth.users WHERE id = auth.uid();
  IF v_email_utilizador IS DISTINCT FROM v_convite.email_normalizado THEN
    RAISE EXCEPTION 'Este convite foi enviado para outro endereço de email';
  END IF;

  INSERT INTO public.adesoes
    (grupo_id, profile_id, papel, origem, iniciado_por, dados_adicionais)
  VALUES
    (v_convite.grupo_id, auth.uid(), v_convite.papel, 'convite',
     v_convite.criado_por, v_convite.dados_adicionais)
  RETURNING id INTO v_adesao_id;

  UPDATE public.adesoes_convites_email
     SET consumido_em = now(), adesao_id = v_adesao_id
   WHERE id = v_convite.id;

  RETURN v_adesao_id;
END;
$$;

-- 10.5 APROVAÇÃO DO MODERADOR
CREATE OR REPLACE FUNCTION public.adesao_aprovar_moderador(p_adesao_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_grupo_id uuid;
BEGIN
  SELECT grupo_id INTO v_grupo_id FROM public.adesoes WHERE id = p_adesao_id;
  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Adesão não encontrada';
  END IF;

  IF NOT public.e_moderador_grupo(v_grupo_id) THEN
    RAISE EXCEPTION 'Sem permissão de moderação neste grupo';
  END IF;

  UPDATE public.adesoes
     SET aprovado_moderador_em  = now(),
         aprovado_moderador_por = auth.uid(),
         recusado_em = NULL, recusado_por = NULL, motivo_recusa = NULL
   WHERE id = p_adesao_id
     AND estado = 'pendente';

  RETURN FOUND;
END;
$$;

-- 10.6 APROVAÇÃO DO TUTOR
CREATE OR REPLACE FUNCTION public.adesao_aprovar_tutor(p_adesao_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid;
  v_requer boolean;
BEGIN
  SELECT profile_id, requer_aprovacao_tutor
    INTO v_profile_id, v_requer
    FROM public.adesoes WHERE id = p_adesao_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Adesão não encontrada';
  END IF;
  IF NOT v_requer THEN
    RAISE EXCEPTION 'Esta adesão não requer aprovação de tutor';
  END IF;
  IF NOT public.e_tutor_confirmado_de(v_profile_id) THEN
    RAISE EXCEPTION 'Não consta como tutor confirmado desta pessoa';
  END IF;

  UPDATE public.adesoes
     SET aprovado_tutor_em  = now(),
         aprovado_tutor_por = auth.uid()
   WHERE id = p_adesao_id
     AND estado = 'pendente';

  RETURN FOUND;
END;
$$;

-- 10.7 RECUSA — moderador ou tutor
CREATE OR REPLACE FUNCTION public.adesao_recusar(
  p_adesao_id uuid,
  p_motivo    text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_grupo_id   uuid;
  v_profile_id uuid;
BEGIN
  SELECT grupo_id, profile_id INTO v_grupo_id, v_profile_id
    FROM public.adesoes WHERE id = p_adesao_id;

  IF v_grupo_id IS NULL THEN
    RAISE EXCEPTION 'Adesão não encontrada';
  END IF;

  IF NOT (public.e_moderador_grupo(v_grupo_id)
          OR public.e_tutor_confirmado_de(v_profile_id)) THEN
    RAISE EXCEPTION 'Sem permissão para recusar esta adesão';
  END IF;

  UPDATE public.adesoes
     SET recusado_em = now(), recusado_por = auth.uid(), motivo_recusa = p_motivo
   WHERE id = p_adesao_id
     AND estado = 'pendente';

  RETURN FOUND;
END;
$$;

-- 10.8 CANCELAR / SAIR — o próprio titular
CREATE OR REPLACE FUNCTION public.adesao_cancelar(p_adesao_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT profile_id INTO v_profile_id FROM public.adesoes WHERE id = p_adesao_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Adesão não encontrada';
  END IF;

  IF NOT (v_profile_id = auth.uid() OR public.e_tutor_confirmado_de(v_profile_id)) THEN
    RAISE EXCEPTION 'Só o próprio ou o seu tutor podem cancelar';
  END IF;

  UPDATE public.adesoes SET estado = 'cancelada' WHERE id = p_adesao_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 11. RLS
-- ============================================================

ALTER TABLE public.grupos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_moderadores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorias                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adesoes                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adesoes_convites_email  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_plataforma       ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY não aceita IF NOT EXISTS → DROP antes de cada CREATE.

-- ---------- grupos ----------
DROP POLICY IF EXISTS grupos_select ON public.grupos;
CREATE POLICY grupos_select ON public.grupos
  FOR SELECT USING (ativo OR public.e_moderador_grupo(id));

DROP POLICY IF EXISTS grupos_insert ON public.grupos;
CREATE POLICY grupos_insert ON public.grupos
  FOR INSERT TO authenticated WITH CHECK (criado_por = auth.uid());

DROP POLICY IF EXISTS grupos_update ON public.grupos;
CREATE POLICY grupos_update ON public.grupos
  FOR UPDATE USING (public.e_admin_grupo(id));

-- ---------- grupos_moderadores ----------
DROP POLICY IF EXISTS grupos_moderadores_select ON public.grupos_moderadores;
CREATE POLICY grupos_moderadores_select ON public.grupos_moderadores
  FOR SELECT TO authenticated USING (true);   -- quem modera um grupo é informação pública

DROP POLICY IF EXISTS grupos_moderadores_insert ON public.grupos_moderadores;
CREATE POLICY grupos_moderadores_insert ON public.grupos_moderadores
  FOR INSERT TO authenticated WITH CHECK (public.e_admin_grupo(grupo_id));

DROP POLICY IF EXISTS grupos_moderadores_delete ON public.grupos_moderadores;
CREATE POLICY grupos_moderadores_delete ON public.grupos_moderadores
  FOR DELETE USING (public.e_admin_grupo(grupo_id));

-- ---------- tutorias ----------
DROP POLICY IF EXISTS tutorias_select ON public.tutorias;
CREATE POLICY tutorias_select ON public.tutorias
  FOR SELECT USING (tutor_profile_id = auth.uid() OR menor_profile_id = auth.uid());

DROP POLICY IF EXISTS tutorias_insert ON public.tutorias;
CREATE POLICY tutorias_insert ON public.tutorias
  FOR INSERT TO authenticated
  WITH CHECK (tutor_profile_id = auth.uid() OR menor_profile_id = auth.uid());

DROP POLICY IF EXISTS tutorias_update ON public.tutorias;
CREATE POLICY tutorias_update ON public.tutorias
  FOR UPDATE USING (tutor_profile_id = auth.uid() OR menor_profile_id = auth.uid());

-- ---------- adesoes ----------
DROP POLICY IF EXISTS adesoes_select ON public.adesoes;
CREATE POLICY adesoes_select ON public.adesoes
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.e_moderador_grupo(grupo_id)
    OR public.e_tutor_confirmado_de(profile_id)
  );

-- Sem INSERT/UPDATE/DELETE diretos: tudo passa pelas RPC da secção 10.
-- Isto impede que um cliente escreva aprovado_moderador_em à mão.

-- ---------- adesoes_convites_email ----------
DROP POLICY IF EXISTS convites_select ON public.adesoes_convites_email;
CREATE POLICY convites_select ON public.adesoes_convites_email
  FOR SELECT USING (public.e_moderador_grupo(grupo_id));

-- ---------- config_plataforma ----------
DROP POLICY IF EXISTS config_select ON public.config_plataforma;
CREATE POLICY config_select ON public.config_plataforma
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 12. GRANTS / SEGURANÇA A NÍVEL DE COLUNA
-- ============================================================
-- Lembrete: um GRANT SELECT ao nível da TABELA anula os GRANTs por
-- coluna. Revogar primeiro, conceder colunas depois — sempre juntos.

-- token_hash e email_normalizado nunca devem sair pelo PostgREST.
REVOKE SELECT ON public.adesoes_convites_email FROM anon, authenticated;
GRANT  SELECT (id, grupo_id, papel, expira_em, consumido_em, adesao_id, criado_por, created_at)
  ON public.adesoes_convites_email TO authenticated;

REVOKE ALL ON public.config_plataforma FROM anon, authenticated;
GRANT SELECT ON public.config_plataforma TO authenticated;

-- As RPC são o único caminho de escrita.
GRANT EXECUTE ON FUNCTION public.adesao_pedir(uuid, text, jsonb)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_convidar_username(uuid, text, text, jsonb)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_convidar_email(uuid, text, text, jsonb)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.convite_email_converter(text)                       TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_aprovar_moderador(uuid)                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_aprovar_tutor(uuid)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_recusar(uuid, text)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.adesao_cancelar(uuid)                               TO authenticated;

REVOKE EXECUTE ON FUNCTION public.adesao_convidar_email(uuid, text, text, jsonb) FROM anon;

COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================================
-- Correr isto a seguir; nenhuma linha deve aparecer em falta.
--
-- SELECT tablename, rowsecurity FROM pg_tables
--  WHERE schemaname='public'
--    AND tablename IN ('grupos','grupos_moderadores','tutorias',
--                      'adesoes','adesoes_convites_email','config_plataforma');
--
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE schemaname='public' AND tablename LIKE 'adesoes%' OR tablename LIKE 'grupos%'
--  ORDER BY tablename, policyname;
--
-- -- pgcrypto é obrigatório para gen_random_bytes/digest:
-- SELECT extname FROM pg_extension WHERE extname = 'pgcrypto';
-- -- se não existir:  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
