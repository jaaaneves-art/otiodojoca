-- Fecha a exposição de emails em profiles.
--
-- A policy "Perfis publicos visiveis para todos" é USING (true) e a
-- coluna email estava preenchida (44/44). Como a RLS filtra linhas e
-- não colunas, qualquer pessoa com a chave publicável — que está no
-- JavaScript do site — lia os endereços todos sem ter conta.
--
-- Confirmado por pedido real à API REST antes e depois da correção.
-- Nenhum ficheiro do projeto faz select('*') em profiles nem lê a
-- coluna email, por isso a correção não parte nada.

REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (id, username, display_name, bio, location, avatar_url,
              reputation, role, created_at, updated_at, deleted_at)
  ON public.profiles TO anon, authenticated;

-- POR FAZER: role e status continuam legíveis por qualquer visitante,
-- o que permite enumerar admins. A correção certa é uma view pública
-- com as colunas seguras e revogar o SELECT direto da tabela.
