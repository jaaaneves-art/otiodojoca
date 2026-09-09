-- =====================================================================
-- OTJ · MÓDULO ESCUTISMO · SCHEMA v1
-- Postgres 16 / Supabase
-- Princípio: segurança primeiro. Menores protegidos por desenho.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ASSOCIAÇÕES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_associacoes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla         text NOT NULL UNIQUE,
  nome          text NOT NULL,
  ativa         boolean NOT NULL DEFAULT true,
  criado_em     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2. AGRUPAMENTOS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_agrupamentos (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  associacao_id      uuid NOT NULL REFERENCES escutismo_associacoes(id) ON DELETE RESTRICT,
  numero             text NOT NULL,
  nome               text NOT NULL,
  distrito           text,
  concelho           text,
  freguesia_cod_ine  text,
  email_institucional text,
  estado             text NOT NULL DEFAULT 'pendente'
                     CHECK (estado IN ('pendente','ativo','suspenso')),
  criado_em          timestamptz NOT NULL DEFAULT now(),
  atualizado_em      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escutismo_agrup_unico UNIQUE (associacao_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_escut_agrup_estado   ON escutismo_agrupamentos (estado);
CREATE INDEX IF NOT EXISTS idx_escut_agrup_distrito ON escutismo_agrupamentos (distrito);

-- ---------------------------------------------------------------------
-- 3. PAPÉIS  (nunca hardcodar emails em policies)
--    nacional_cne  -> RESERVADO, não populado no MVP
--    responsavel   -> mínimo 2 por agrupamento ativo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_papeis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  papel           text NOT NULL CHECK (papel IN ('nacional_cne','responsavel')),
  agrupamento_id  uuid REFERENCES escutismo_agrupamentos(id) ON DELETE CASCADE,
  ativo           boolean NOT NULL DEFAULT true,
  atribuido_por   uuid REFERENCES auth.users(id),
  criado_em       timestamptz NOT NULL DEFAULT now(),
  revogado_em     timestamptz,
  CONSTRAINT escut_papel_escopo CHECK (
    (papel = 'nacional_cne'  AND agrupamento_id IS NULL) OR
    (papel = 'responsavel'   AND agrupamento_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_escut_papel_unico
  ON escutismo_papeis (user_id, papel, COALESCE(agrupamento_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE ativo;

CREATE INDEX IF NOT EXISTS idx_escut_papel_agrup ON escutismo_papeis (agrupamento_id) WHERE ativo;

-- ---------------------------------------------------------------------
-- 4. MEMBROS
--    e_menor NÃO é GENERATED: AGE()/now() são STABLE, não IMMUTABLE.
--    Calculado por trigger no registo e recalculável por job.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_membros (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  agrupamento_id         uuid REFERENCES escutismo_agrupamentos(id) ON DELETE SET NULL,
  nome                   text NOT NULL,
  data_nascimento        date NOT NULL,
  escalao                text NOT NULL CHECK (escalao IN
                           ('lobitos','exploradores','pioneiros','caminheiros','dirigente')),
  estado                 text NOT NULL DEFAULT 'pendente'
                         CHECK (estado IN ('pendente','ativo','rejeitado','suspenso','saiu')),
  e_menor                boolean NOT NULL DEFAULT true,

  -- Proteção de menores (RGPD art. 8 / Lei 58/2019 art. 16)
  encarregado_nome       text,
  encarregado_email      text,
  consentimento_dado     boolean NOT NULL DEFAULT false,
  consentimento_token    text,          -- guardar SEMPRE hash, nunca o token em claro
  consentimento_em       timestamptz,

  criado_em              timestamptz NOT NULL DEFAULT now(),
  atualizado_em          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT escut_menor_exige_encarregado CHECK (
    NOT e_menor OR (encarregado_nome IS NOT NULL AND encarregado_email IS NOT NULL)
  ),
  CONSTRAINT escut_menor_ativo_exige_consentimento CHECK (
    estado <> 'ativo' OR NOT e_menor OR consentimento_dado
  )
);

CREATE INDEX IF NOT EXISTS idx_escut_membro_agrup  ON escutismo_membros (agrupamento_id, estado);
CREATE INDEX IF NOT EXISTS idx_escut_membro_estado ON escutismo_membros (estado);

-- ---------------------------------------------------------------------
-- 5. PEDIDOS DE ADESÃO  (dupla confirmação)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_pedidos_adesao (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membro_id       uuid NOT NULL REFERENCES escutismo_membros(id) ON DELETE CASCADE,
  agrupamento_id  uuid NOT NULL REFERENCES escutismo_agrupamentos(id) ON DELETE CASCADE,
  estado          text NOT NULL DEFAULT 'pendente'
                  CHECK (estado IN ('pendente','aprovado','rejeitado','expirado')),
  criado_em       timestamptz NOT NULL DEFAULT now(),
  decidido_em     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_escut_pedido_aberto
  ON escutismo_pedidos_adesao (membro_id) WHERE estado = 'pendente';
CREATE INDEX IF NOT EXISTS idx_escut_pedido_agrup
  ON escutismo_pedidos_adesao (agrupamento_id, estado);

CREATE TABLE IF NOT EXISTS escutismo_pedido_aprovacoes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id          uuid NOT NULL REFERENCES escutismo_pedidos_adesao(id) ON DELETE CASCADE,
  responsavel_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decisao            text NOT NULL CHECK (decisao IN ('aprovado','rejeitado')),
  motivo             text,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escut_aprovacao_unica UNIQUE (pedido_id, responsavel_user_id)
);

-- ---------------------------------------------------------------------
-- 6. COMUNICAÇÕES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_comunicacoes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo                   text NOT NULL CHECK (tipo IN (
                           'nacional_agrupamentos',
                           'nacional_membros',
                           'agrupamento_membros',
                           'agrupamento_agrupamento',
                           'membro_agrupamento',
                           'membro_membro')),
  remetente_user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agrupamento_origem_id  uuid REFERENCES escutismo_agrupamentos(id) ON DELETE CASCADE,
  agrupamento_destino_id uuid REFERENCES escutismo_agrupamentos(id) ON DELETE CASCADE,
  destinatario_user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  escaloes_alvo          text[] NOT NULL DEFAULT '{}',
  titulo                 text NOT NULL,
  corpo                  text NOT NULL,
  anexos                 jsonb NOT NULL DEFAULT '[]'::jsonb,
  supervisionada         boolean NOT NULL DEFAULT false, -- true se envolve menor
  estado                 text NOT NULL DEFAULT 'publicada'
                         CHECK (estado IN ('publicada','removida')),
  removida_por           uuid REFERENCES auth.users(id),
  motivo_remocao         text,
  expira_em              timestamptz,
  criado_em              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escut_com_tipo    ON escutismo_comunicacoes (tipo, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_escut_com_destino ON escutismo_comunicacoes (agrupamento_destino_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_escut_com_origem  ON escutismo_comunicacoes (agrupamento_origem_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_escut_com_dm      ON escutismo_comunicacoes (destinatario_user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_escut_com_anexos  ON escutismo_comunicacoes USING GIN (anexos);

CREATE TABLE IF NOT EXISTS escutismo_leituras (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comunicacao_id  uuid NOT NULL REFERENCES escutismo_comunicacoes(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lida_em         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT escut_leitura_unica UNIQUE (comunicacao_id, user_id)
);

-- ---------------------------------------------------------------------
-- 7. AUDITORIA (append-only, escrita só por service role)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS escutismo_auditoria (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ator_user_id uuid,
  acao         text NOT NULL,
  entidade     text NOT NULL,
  entidade_id  uuid,
  detalhe      jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escut_audit_entidade ON escutismo_auditoria (entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_escut_audit_data     ON escutismo_auditoria (criado_em DESC);

-- =====================================================================
-- FUNÇÕES AUXILIARES (SECURITY DEFINER -> quebram recursão de RLS)
-- =====================================================================

CREATE OR REPLACE FUNCTION escutismo_e_nacional()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM escutismo_papeis
    WHERE user_id = auth.uid() AND papel = 'nacional_cne' AND ativo
  );
$$;

CREATE OR REPLACE FUNCTION escutismo_meu_agrupamento()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT agrupamento_id FROM escutismo_membros
  WHERE user_id = auth.uid() AND estado = 'ativo';
$$;

CREATE OR REPLACE FUNCTION escutismo_e_responsavel(p_agrupamento uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM escutismo_papeis
    WHERE user_id = auth.uid()
      AND papel = 'responsavel'
      AND ativo
      AND agrupamento_id = p_agrupamento
  );
$$;

CREATE OR REPLACE FUNCTION escutismo_e_menor(p_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT COALESCE(
    (SELECT data_nascimento > (CURRENT_DATE - INTERVAL '18 years')
       FROM escutismo_membros WHERE user_id = p_user),
    true);   -- desconhecido => trata como menor (fail-safe)
$$;

-- =====================================================================
-- TRIGGERS DE INTEGRIDADE E SEGURANÇA
-- =====================================================================

CREATE OR REPLACE FUNCTION escutismo_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_agrup_touch ON escutismo_agrupamentos;
CREATE TRIGGER trg_escut_agrup_touch BEFORE UPDATE ON escutismo_agrupamentos
FOR EACH ROW EXECUTE FUNCTION escutismo_touch();

DROP TRIGGER IF EXISTS trg_escut_membro_touch ON escutismo_membros;
CREATE TRIGGER trg_escut_membro_touch BEFORE UPDATE ON escutismo_membros
FOR EACH ROW EXECUTE FUNCTION escutismo_touch();

-- 8.1 e_menor calculado no servidor, nunca vindo do cliente
CREATE OR REPLACE FUNCTION escutismo_set_menor()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.e_menor := NEW.data_nascimento > (CURRENT_DATE - INTERVAL '18 years');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_set_menor ON escutismo_membros;
CREATE TRIGGER trg_escut_set_menor BEFORE INSERT OR UPDATE OF data_nascimento
ON escutismo_membros FOR EACH ROW EXECUTE FUNCTION escutismo_set_menor();

-- 8.2 Mínimo de 2 responsáveis por agrupamento ativo
CREATE OR REPLACE FUNCTION escutismo_valida_min_responsaveis()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_agrup uuid;
  v_total int;
  v_estado text;
BEGIN
  v_agrup := COALESCE(OLD.agrupamento_id, NEW.agrupamento_id);
  IF v_agrup IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT estado INTO v_estado FROM escutismo_agrupamentos WHERE id = v_agrup;
  IF v_estado IS DISTINCT FROM 'ativo' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT count(*) INTO v_total
  FROM escutismo_papeis
  WHERE agrupamento_id = v_agrup AND papel = 'responsavel' AND ativo;

  IF v_total < 2 THEN
    RAISE EXCEPTION 'Agrupamento ativo exige no minimo 2 responsaveis (atual: %)', v_total;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_min_resp ON escutismo_papeis;
CREATE CONSTRAINT TRIGGER trg_escut_min_resp
AFTER UPDATE OR DELETE ON escutismo_papeis
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION escutismo_valida_min_responsaveis();

-- 8.3 Agrupamento só passa a 'ativo' com 2 responsáveis
CREATE OR REPLACE FUNCTION escutismo_valida_ativacao_agrupamento()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_total int;
BEGIN
  IF NEW.estado = 'ativo' AND OLD.estado IS DISTINCT FROM 'ativo' THEN
    SELECT count(*) INTO v_total
    FROM escutismo_papeis
    WHERE agrupamento_id = NEW.id AND papel = 'responsavel' AND ativo;
    IF v_total < 2 THEN
      RAISE EXCEPTION 'Nao e possivel ativar agrupamento sem 2 responsaveis (atual: %)', v_total;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_ativacao ON escutismo_agrupamentos;
CREATE TRIGGER trg_escut_ativacao BEFORE UPDATE ON escutismo_agrupamentos
FOR EACH ROW EXECUTE FUNCTION escutismo_valida_ativacao_agrupamento();

-- 8.4 Dupla confirmação: 2 responsáveis distintos aprovam -> membro ativo
CREATE OR REPLACE FUNCTION escutismo_processa_aprovacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_agrup uuid;
  v_membro uuid;
  v_aprov int;
BEGIN
  SELECT agrupamento_id, membro_id INTO v_agrup, v_membro
  FROM escutismo_pedidos_adesao WHERE id = NEW.pedido_id;

  -- quem decide tem de ser responsável desse agrupamento
  IF NOT EXISTS (
    SELECT 1 FROM escutismo_papeis
    WHERE user_id = NEW.responsavel_user_id
      AND papel = 'responsavel' AND ativo AND agrupamento_id = v_agrup
  ) THEN
    RAISE EXCEPTION 'Apenas responsaveis do agrupamento podem decidir este pedido';
  END IF;

  -- rejeição de um responsável basta para rejeitar
  IF NEW.decisao = 'rejeitado' THEN
    UPDATE escutismo_pedidos_adesao
       SET estado = 'rejeitado', decidido_em = now()
     WHERE id = NEW.pedido_id;
    UPDATE escutismo_membros SET estado = 'rejeitado' WHERE id = v_membro;
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_aprov
  FROM escutismo_pedido_aprovacoes
  WHERE pedido_id = NEW.pedido_id AND decisao = 'aprovado';

  IF v_aprov >= 2 THEN
    UPDATE escutismo_pedidos_adesao
       SET estado = 'aprovado', decidido_em = now()
     WHERE id = NEW.pedido_id AND estado = 'pendente';

    -- menor só fica ativo depois do consentimento do encarregado
    UPDATE escutismo_membros m
       SET estado = 'ativo', agrupamento_id = v_agrup
     WHERE m.id = v_membro
       AND (NOT m.e_menor OR m.consentimento_dado);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_aprovacao ON escutismo_pedido_aprovacoes;
CREATE TRIGGER trg_escut_aprovacao AFTER INSERT ON escutismo_pedido_aprovacoes
FOR EACH ROW EXECUTE FUNCTION escutismo_processa_aprovacao();

-- 8.5 PROTEÇÃO DE MENORES nas comunicações
--     Regra dura: sem mensagens privadas adulto <-> menor.
--     DM entre menores: só dentro do mesmo agrupamento e sempre supervisionada.
CREATE OR REPLACE FUNCTION escutismo_valida_comunicacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_rem_menor bool;
  v_dst_menor bool;
  v_rem_agrup uuid;
  v_dst_agrup uuid;
BEGIN
  IF NEW.tipo <> 'membro_membro' THEN
    -- canais de grupo: se algum menor recebe, fica supervisionado
    IF NEW.tipo IN ('agrupamento_membros','nacional_membros') THEN
      NEW.supervisionada := true;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.destinatario_user_id IS NULL THEN
    RAISE EXCEPTION 'Mensagem direta exige destinatario';
  END IF;

  SELECT e_menor, agrupamento_id INTO v_rem_menor, v_rem_agrup
    FROM escutismo_membros WHERE user_id = NEW.remetente_user_id AND estado = 'ativo';
  SELECT e_menor, agrupamento_id INTO v_dst_menor, v_dst_agrup
    FROM escutismo_membros WHERE user_id = NEW.destinatario_user_id AND estado = 'ativo';

  IF v_rem_menor IS NULL OR v_dst_menor IS NULL THEN
    RAISE EXCEPTION 'Mensagem direta so entre membros ativos';
  END IF;

  IF v_rem_menor <> v_dst_menor THEN
    RAISE EXCEPTION 'Mensagens privadas entre adulto e menor nao sao permitidas; usar canal do agrupamento';
  END IF;

  IF v_rem_menor AND v_dst_menor THEN
    IF v_rem_agrup IS DISTINCT FROM v_dst_agrup THEN
      RAISE EXCEPTION 'Menores so comunicam dentro do proprio agrupamento';
    END IF;
    NEW.supervisionada := true;   -- legível pelos 2 responsáveis
  END IF;

  -- carimbar agrupamento de origem: é o que permite a supervisão via RLS
  NEW.agrupamento_origem_id := v_rem_agrup;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_valida_com ON escutismo_comunicacoes;
CREATE TRIGGER trg_escut_valida_com BEFORE INSERT ON escutismo_comunicacoes
FOR EACH ROW EXECUTE FUNCTION escutismo_valida_comunicacao();

-- 8.6 Auditoria automática de comunicações supervisionadas
CREATE OR REPLACE FUNCTION escutismo_audita_comunicacao()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  INSERT INTO escutismo_auditoria (ator_user_id, acao, entidade, entidade_id, detalhe)
  VALUES (NEW.remetente_user_id, 'comunicacao_criada', 'escutismo_comunicacoes', NEW.id,
          jsonb_build_object('tipo', NEW.tipo, 'supervisionada', NEW.supervisionada));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_audit_com ON escutismo_comunicacoes;
CREATE TRIGGER trg_escut_audit_com AFTER INSERT ON escutismo_comunicacoes
FOR EACH ROW EXECUTE FUNCTION escutismo_audita_comunicacao();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
ALTER TABLE escutismo_associacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_agrupamentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_papeis             ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_membros            ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_pedidos_adesao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_pedido_aprovacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_comunicacoes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_leituras           ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_auditoria          ENABLE ROW LEVEL SECURITY;

-- Associações e agrupamentos: catálogo legível por autenticados
DROP POLICY IF EXISTS escut_assoc_select ON escutismo_associacoes;
CREATE POLICY escut_assoc_select ON escutismo_associacoes
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS escut_agrup_select ON escutismo_agrupamentos;
CREATE POLICY escut_agrup_select ON escutismo_agrupamentos
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS escut_agrup_update ON escutismo_agrupamentos;
CREATE POLICY escut_agrup_update ON escutismo_agrupamentos
FOR UPDATE TO authenticated
USING (escutismo_e_nacional() OR escutismo_e_responsavel(id))
WITH CHECK (escutismo_e_nacional() OR escutismo_e_responsavel(id));

-- Papéis: cada um vê os seus; responsáveis veem os do agrupamento
DROP POLICY IF EXISTS escut_papeis_select ON escutismo_papeis;
CREATE POLICY escut_papeis_select ON escutismo_papeis
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR escutismo_e_nacional()
  OR escutismo_e_responsavel(agrupamento_id)
);

-- Membros: o próprio, colegas de agrupamento, responsáveis, nacional
DROP POLICY IF EXISTS escut_membros_select ON escutismo_membros;
CREATE POLICY escut_membros_select ON escutismo_membros
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR escutismo_e_nacional()
  OR escutismo_e_responsavel(agrupamento_id)
  OR (estado = 'ativo' AND agrupamento_id = escutismo_meu_agrupamento())
);

DROP POLICY IF EXISTS escut_membros_insert ON escutismo_membros;
CREATE POLICY escut_membros_insert ON escutismo_membros
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND estado = 'pendente');

DROP POLICY IF EXISTS escut_membros_update ON escutismo_membros;
CREATE POLICY escut_membros_update ON escutismo_membros
FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR escutismo_e_responsavel(agrupamento_id) OR escutismo_e_nacional())
WITH CHECK (user_id = auth.uid() OR escutismo_e_responsavel(agrupamento_id) OR escutismo_e_nacional());

-- Pedidos de adesão
DROP POLICY IF EXISTS escut_pedidos_select ON escutismo_pedidos_adesao;
CREATE POLICY escut_pedidos_select ON escutismo_pedidos_adesao
FOR SELECT TO authenticated
USING (
  escutismo_e_responsavel(agrupamento_id)
  OR escutismo_e_nacional()
  OR membro_id IN (SELECT id FROM escutismo_membros WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS escut_pedidos_insert ON escutismo_pedidos_adesao;
CREATE POLICY escut_pedidos_insert ON escutismo_pedidos_adesao
FOR INSERT TO authenticated
WITH CHECK (membro_id IN (SELECT id FROM escutismo_membros WHERE user_id = auth.uid()));

-- Aprovações: só responsáveis do agrupamento do pedido
DROP POLICY IF EXISTS escut_aprov_select ON escutismo_pedido_aprovacoes;
CREATE POLICY escut_aprov_select ON escutismo_pedido_aprovacoes
FOR SELECT TO authenticated
USING (
  escutismo_e_nacional()
  OR EXISTS (
    SELECT 1 FROM escutismo_pedidos_adesao p
    WHERE p.id = pedido_id AND escutismo_e_responsavel(p.agrupamento_id)
  )
);

DROP POLICY IF EXISTS escut_aprov_insert ON escutismo_pedido_aprovacoes;
CREATE POLICY escut_aprov_insert ON escutismo_pedido_aprovacoes
FOR INSERT TO authenticated
WITH CHECK (
  responsavel_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM escutismo_pedidos_adesao p
    WHERE p.id = pedido_id AND escutismo_e_responsavel(p.agrupamento_id)
  )
);

-- Comunicações: leitura
DROP POLICY IF EXISTS escut_com_select ON escutismo_comunicacoes;
CREATE POLICY escut_com_select ON escutismo_comunicacoes
FOR SELECT TO authenticated
USING (
  estado = 'publicada'
  AND (
    escutismo_e_nacional()
    OR tipo IN ('nacional_agrupamentos','nacional_membros')
    OR remetente_user_id = auth.uid()
    OR destinatario_user_id = auth.uid()
    OR (tipo = 'agrupamento_membros' AND agrupamento_origem_id = escutismo_meu_agrupamento())
    OR (tipo = 'agrupamento_agrupamento' AND (
          escutismo_e_responsavel(agrupamento_origem_id)
       OR escutismo_e_responsavel(agrupamento_destino_id)))
    OR (tipo = 'membro_agrupamento' AND escutismo_e_responsavel(agrupamento_destino_id))
    -- supervisão: responsáveis leem DM de menores do seu agrupamento
    -- (usa agrupamento_origem_id porque um responsável pode não ter registo de membro)
    OR (tipo = 'membro_membro' AND supervisionada
        AND escutismo_e_responsavel(agrupamento_origem_id))
  )
);

-- Comunicações: escrita (o trigger valida menores; a policy valida papel)
DROP POLICY IF EXISTS escut_com_insert ON escutismo_comunicacoes;
CREATE POLICY escut_com_insert ON escutismo_comunicacoes
FOR INSERT TO authenticated
WITH CHECK (
  remetente_user_id = auth.uid()
  AND (
    (tipo IN ('nacional_agrupamentos','nacional_membros') AND escutismo_e_nacional())
    OR (tipo = 'agrupamento_membros'     AND escutismo_e_responsavel(agrupamento_origem_id))
    OR (tipo = 'agrupamento_agrupamento' AND escutismo_e_responsavel(agrupamento_origem_id))
    OR (tipo = 'membro_agrupamento'      AND agrupamento_destino_id = escutismo_meu_agrupamento())
    OR (tipo = 'membro_membro'           AND escutismo_meu_agrupamento() IS NOT NULL)
  )
);

DROP POLICY IF EXISTS escut_com_update ON escutismo_comunicacoes;
CREATE POLICY escut_com_update ON escutismo_comunicacoes
FOR UPDATE TO authenticated
USING (
  remetente_user_id = auth.uid()
  OR escutismo_e_nacional()
  OR escutismo_e_responsavel(agrupamento_origem_id)
)
WITH CHECK (
  remetente_user_id = auth.uid()
  OR escutismo_e_nacional()
  OR escutismo_e_responsavel(agrupamento_origem_id)
);

-- Leituras
DROP POLICY IF EXISTS escut_leituras_all ON escutismo_leituras;
CREATE POLICY escut_leituras_all ON escutismo_leituras
FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Auditoria: leitura restrita, escrita só service role (sem policy INSERT)
DROP POLICY IF EXISTS escut_audit_select ON escutismo_auditoria;
CREATE POLICY escut_audit_select ON escutismo_auditoria
FOR SELECT TO authenticated
USING (escutismo_e_nacional());

-- =====================================================================
-- SEED MÍNIMO
-- =====================================================================
INSERT INTO escutismo_associacoes (sigla, nome)
VALUES ('CNE', 'Corpo Nacional de Escutas')
ON CONFLICT (sigla) DO NOTHING;

-- NOTA: o papel 'nacional_cne' fica RESERVADO e por popular.
-- Só deve ser atribuído a pessoa indicada formalmente pelo CNE.
