-- Acrescenta profiles.data_nascimento — necessária para a camada de
-- Adesões (public.e_menor()) distinguir maiores de menores; sem esta
-- coluna, e_menor() falha sempre para "é menor" (por desenho), o que
-- deixa qualquer adesão presa em "pendente" para sempre, mesmo a de um
-- adulto confirmado.
--
-- Opcional (nullable) de propósito: contas já existentes não ficam
-- inválidas, e continuam a ser tratadas como "menor" até preencherem.
--
-- SEM grant de SELECT nem de UPDATE para anon/authenticated — data de
-- nascimento é mais sensível do que bio/location/display_name (que já
-- são publicamente legíveis via "Perfis publicos visiveis para todos",
-- USING (true)) e não deve seguir o mesmo caminho. O acesso de
-- leitura/escrita à própria data de nascimento passa só por
-- lib/perfil/data-nascimento.ts, com service role, restrito ao próprio
-- utilizador autenticado. Mesmo padrão de decisão já usado para
-- profiles.email em 20260906090000_seguranca_proteger_email_perfis.sql.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS data_nascimento date;

DO $$
BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profiles_data_nascimento_razoavel CHECK (
      data_nascimento IS NULL
      OR (data_nascimento <= current_date
          AND data_nascimento >= current_date - interval '120 years')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.profiles.data_nascimento IS
  'Opcional, auto-declarada. Privada -- sem GRANT para anon/authenticated. '
  'Acesso só via lib/perfil/data-nascimento.ts (service role, próprio utilizador). '
  'Usada por public.e_menor() para dispensar aprovação de tutor na camada de Adesões.';
