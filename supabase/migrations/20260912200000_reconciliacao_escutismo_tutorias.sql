-- RECONCILIAÇÃO ESCUTISMO ↔ TUTORIAS — Opção A
-- Remove encarregado_nome/email (texto livre) — Escutismo agora usa tutorias genérico

BEGIN;

-- 1. Dropar a view que depende
DROP VIEW IF EXISTS public.escutismo_membros_v CASCADE;

-- 2. Remover colunas de texto livre
ALTER TABLE public.escutismo_membros
  DROP COLUMN IF EXISTS encarregado_nome,
  DROP COLUMN IF EXISTS encarregado_email;

-- 3. Adicionar referência a tutorias
ALTER TABLE public.escutismo_membros
  ADD COLUMN tutoria_id UUID REFERENCES public.tutorias(id) ON DELETE SET NULL;

-- 4. Índice para performance
CREATE INDEX idx_escutismo_membros_tutoria ON public.escutismo_membros(tutoria_id);

-- 5. Recriar a view ATUALIZADA (sem encarregado_nome/email, com tutoria_id)
CREATE VIEW public.escutismo_membros_v AS
SELECT 
  m.id,
  m.user_id,
  m.agrupamento_id,
  m.nome,
  m.data_nascimento,
  m.escalao,
  m.estado,
  m.e_menor,
  m.tutoria_id,
  m.consentimento_dado,
  m.consentimento_token,
  m.consentimento_em,
  m.criado_em,
  m.atualizado_em,
  (EXTRACT(year FROM age(CURRENT_DATE::timestamp with time zone, m.data_nascimento::timestamp with time zone)))::integer AS idade,
  (m.data_nascimento > (CURRENT_DATE - '18 years'::interval)) AS menor_agora
FROM public.escutismo_membros m;

-- 6. Comentário para documentação
COMMENT ON COLUMN public.escutismo_membros.tutoria_id IS 
  'Referência à tutoria genérica (encarregado de educação) — reconciliação Opção A com camada de Adesões';

COMMIT;
