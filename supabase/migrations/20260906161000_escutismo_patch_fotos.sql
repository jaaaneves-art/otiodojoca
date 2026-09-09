-- ============================================================
-- ESCUTISMO · Patch sobre o schema v1
-- Correr DEPOIS de escutismo-schema-v1.sql
-- ============================================================
-- 1. Pipeline de fotografias (vinha do v5; o v1 não tinha nada)
-- 2. Correção do e_menor, que ficava desatualizado
-- 3. Escalões por associação, em vez de fixos numa federação
--
-- ROLLBACK no fim.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. e_menor desatualizava-se
-- ------------------------------------------------------------
-- O trigger do v1 é BEFORE INSERT OR UPDATE OF data_nascimento.
-- A data de nascimento nunca muda, logo a coluna nunca é recalculada:
-- quem entra com 17 anos fica e_menor = true para sempre.
--
-- Ao mesmo tempo, a função escutismo_e_menor() calcula ao vivo. Ficavam
-- duas fontes a discordar — as CHECK constraints usam a coluna, as
-- policies usam a função.
--
-- Correção: a coluna passa a ser mantida por uma função de manutenção,
-- e há uma view que expõe o valor calculado para leitura.

CREATE OR REPLACE FUNCTION escutismo_atualiza_menoridade()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH atualizados AS (
    UPDATE escutismo_membros
       SET e_menor = (data_nascimento > (CURRENT_DATE - INTERVAL '18 years'))
     WHERE e_menor <> (data_nascimento > (CURRENT_DATE - INTERVAL '18 years'))
    RETURNING 1
  )
  SELECT count(*)::integer FROM atualizados;
$$;

COMMENT ON FUNCTION escutismo_atualiza_menoridade() IS
  'Corrige e_menor de quem fez 18 anos. Correr diariamente por pg_cron.';

REVOKE EXECUTE ON FUNCTION escutismo_atualiza_menoridade() FROM public, anon, authenticated;

-- Leitura sempre correta, independente do estado da coluna
CREATE OR REPLACE VIEW escutismo_membros_v
WITH (security_invoker = true) AS
SELECT m.*,
       (EXTRACT(YEAR FROM age(CURRENT_DATE, m.data_nascimento)))::int AS idade,
       (m.data_nascimento > (CURRENT_DATE - INTERVAL '18 years'))     AS menor_agora
FROM escutismo_membros m;

COMMENT ON VIEW escutismo_membros_v IS
  'Usar esta view no frontend. menor_agora e calculado; e_menor e a coluna materializada.';

GRANT SELECT ON escutismo_membros_v TO authenticated;

-- ------------------------------------------------------------
-- 2. Escalões dependem da associação
-- ------------------------------------------------------------
-- O v1 fixa lobitos/exploradores/pioneiros/caminheiros/dirigente, que
-- são os nomes da AEP. O CNE usa lobitos/exploradores/pioneiros/
-- caminheiros também, mas outras associações divergem — e o v1 existe
-- justamente para suportar várias.
--
-- Em vez de alargar o CHECK a todos os nomes possíveis, a lista passa a
-- vir da associação. O CHECK antigo é removido.

ALTER TABLE escutismo_associacoes
  ADD COLUMN IF NOT EXISTS escaloes text[] NOT NULL
  DEFAULT ARRAY['lobitos','exploradores','pioneiros','caminheiros','dirigente'];

COMMENT ON COLUMN escutismo_associacoes.escaloes IS
  'Nomes dos escaloes desta associacao. Valida escutismo_membros.escalao.';

ALTER TABLE escutismo_membros DROP CONSTRAINT IF EXISTS escutismo_membros_escalao_check;

CREATE OR REPLACE FUNCTION escutismo_valida_escalao()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_escaloes text[];
BEGIN
  IF NEW.agrupamento_id IS NULL THEN
    RETURN NEW;   -- sem agrupamento ainda, valida-se na adesão
  END IF;

  SELECT a.escaloes INTO v_escaloes
  FROM escutismo_agrupamentos g
  JOIN escutismo_associacoes a ON a.id = g.associacao_id
  WHERE g.id = NEW.agrupamento_id;

  IF v_escaloes IS NOT NULL AND NOT (NEW.escalao = ANY (v_escaloes)) THEN
    RAISE EXCEPTION 'Escalao "%" nao existe nesta associacao. Validos: %',
      NEW.escalao, array_to_string(v_escaloes, ', ');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_valida_escalao ON escutismo_membros;
CREATE TRIGGER trg_escut_valida_escalao
  BEFORE INSERT OR UPDATE OF escalao, agrupamento_id ON escutismo_membros
  FOR EACH ROW EXECUTE FUNCTION escutismo_valida_escalao();

-- ------------------------------------------------------------
-- 3. Fotografias
-- ------------------------------------------------------------
-- Regra: dentro do agrupamento, o original. Fora, apenas o derivado
-- desfocado, gerado no servidor. Blur em CSS não protege — o ficheiro
-- original é transferido para o browser antes de ser desfocado.
CREATE TABLE IF NOT EXISTS escutismo_fotos (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agrupamento_id         uuid NOT NULL REFERENCES escutismo_agrupamentos(id) ON DELETE CASCADE,
  comunicacao_id         uuid REFERENCES escutismo_comunicacoes(id) ON DELETE SET NULL,
  carregada_por_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- bucket PRIVADO; nunca servido fora do agrupamento
  path_original          text NOT NULL,
  -- derivado desfocado; única versão servível em contexto público
  path_desfocado         text,

  contem_menores         boolean NOT NULL DEFAULT false,
  estado_processamento   text NOT NULL DEFAULT 'pendente'
                         CHECK (estado_processamento IN ('pendente','processando','concluido','erro')),
  processado_em          timestamptz,
  erro_processamento     text,
  criado_em              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escut_fotos_agrup ON escutismo_fotos (agrupamento_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_escut_fotos_com   ON escutismo_fotos (comunicacao_id);
CREATE INDEX IF NOT EXISTS idx_escut_fotos_fila  ON escutismo_fotos (criado_em)
  WHERE estado_processamento IN ('pendente','erro');

COMMENT ON COLUMN escutismo_fotos.path_original IS
  'Bucket PRIVADO. Nunca servir fora do agrupamento.';
COMMENT ON COLUMN escutismo_fotos.path_desfocado IS
  'Derivado gerado no servidor. Unica versao servivel publicamente.';

-- Quem aparece em cada foto: marcado explicitamente, não por deteção
-- automática. Falhar um rosto significa publicar a cara de uma criança.
CREATE TABLE IF NOT EXISTS escutismo_fotos_membros (
  foto_id            uuid NOT NULL REFERENCES escutismo_fotos(id) ON DELETE CASCADE,
  membro_id          uuid NOT NULL REFERENCES escutismo_membros(id) ON DELETE CASCADE,
  era_menor          boolean NOT NULL,
  consentimento_ok   boolean NOT NULL DEFAULT false,
  criado_em          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (foto_id, membro_id)
);

CREATE INDEX IF NOT EXISTS idx_escut_fotos_membro ON escutismo_fotos_membros (membro_id);

-- Uma foto com menores não passa a 'concluido' sem derivado desfocado
CREATE OR REPLACE FUNCTION escutismo_valida_foto()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.contem_menores
     AND NEW.estado_processamento = 'concluido'
     AND NEW.path_desfocado IS NULL THEN
    RAISE EXCEPTION
      'Foto com menores nao pode ficar concluida sem versao desfocada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_valida_foto ON escutismo_fotos;
CREATE TRIGGER trg_escut_valida_foto
  BEFORE INSERT OR UPDATE ON escutismo_fotos
  FOR EACH ROW EXECUTE FUNCTION escutismo_valida_foto();

-- contem_menores derivado de quem está marcado, não do que o cliente diz
CREATE OR REPLACE FUNCTION escutismo_marca_foto_menores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE escutismo_fotos f
     SET contem_menores = EXISTS (
           SELECT 1 FROM escutismo_fotos_membros fm
           WHERE fm.foto_id = f.id AND fm.era_menor)
   WHERE f.id = COALESCE(NEW.foto_id, OLD.foto_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_escut_foto_menores ON escutismo_fotos_membros;
CREATE TRIGGER trg_escut_foto_menores
  AFTER INSERT OR UPDATE OR DELETE ON escutismo_fotos_membros
  FOR EACH ROW EXECUTE FUNCTION escutismo_marca_foto_menores();

-- ------------------------------------------------------------
-- 4. RLS das fotografias
-- ------------------------------------------------------------
ALTER TABLE escutismo_fotos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE escutismo_fotos_membros ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER para quebrar a recursão entre as duas tabelas:
-- sem isto, a policy de escutismo_fotos consulta escutismo_fotos_membros
-- e vice-versa.
CREATE OR REPLACE FUNCTION escutismo_fotos_dos_meus_membros()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT fm.foto_id
  FROM escutismo_fotos_membros fm
  JOIN escutismo_membros m ON m.id = fm.membro_id
  WHERE m.user_id = auth.uid();
$$;

DROP POLICY IF EXISTS escut_fotos_select ON escutismo_fotos;
CREATE POLICY escut_fotos_select ON escutismo_fotos
  FOR SELECT TO authenticated
  USING (
    agrupamento_id = escutismo_meu_agrupamento()
    OR escutismo_e_responsavel(agrupamento_id)
    OR escutismo_e_nacional()
  );

DROP POLICY IF EXISTS escut_fotos_insert ON escutismo_fotos;
CREATE POLICY escut_fotos_insert ON escutismo_fotos
  FOR INSERT TO authenticated
  WITH CHECK (
    agrupamento_id = escutismo_meu_agrupamento()
    OR escutismo_e_responsavel(agrupamento_id)
  );

DROP POLICY IF EXISTS escut_fotos_membros_select ON escutismo_fotos_membros;
CREATE POLICY escut_fotos_membros_select ON escutismo_fotos_membros
  FOR SELECT TO authenticated
  USING (
    foto_id IN (SELECT escutismo_fotos_dos_meus_membros())
    OR escutismo_e_nacional()
  );

REVOKE ALL ON escutismo_fotos, escutismo_fotos_membros FROM anon, authenticated;
GRANT SELECT, INSERT ON escutismo_fotos         TO authenticated;
GRANT SELECT          ON escutismo_fotos_membros TO authenticated;

COMMIT;

-- ============================================================
-- ROLLBACK
-- ============================================================
-- BEGIN;
--   DROP TABLE IF EXISTS escutismo_fotos_membros;
--   DROP TABLE IF EXISTS escutismo_fotos;
--   DROP VIEW  IF EXISTS escutismo_membros_v;
--   DROP FUNCTION IF EXISTS escutismo_fotos_dos_meus_membros();
--   DROP FUNCTION IF EXISTS escutismo_valida_foto();
--   DROP FUNCTION IF EXISTS escutismo_marca_foto_menores();
--   DROP FUNCTION IF EXISTS escutismo_atualiza_menoridade();
--   DROP TRIGGER IF EXISTS trg_escut_valida_escalao ON escutismo_membros;
--   DROP FUNCTION IF EXISTS escutismo_valida_escalao();
--   ALTER TABLE escutismo_associacoes DROP COLUMN IF EXISTS escaloes;
-- COMMIT;
