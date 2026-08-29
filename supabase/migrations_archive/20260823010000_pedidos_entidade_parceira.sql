-- ============================================================
-- Pedidos de entidade parceira — ponto de entrada para registo/entrada
-- de utilizadores institucionais (Junta de Freguesia, Município,
-- Cooperativa, Associação, Organização de Produtores, etc.)
-- ============================================================
-- Contexto (ver docs/PARCEIROS-ENTRADA.md para a análise completa):
--
-- "entidades" já existe como diretório curado/importado (workflow
-- rascunho -> pendente -> validado -> publicado -> desactualizado ->
-- arquivado, com colunas origem/fonte_url/data_verificacao típicas de
-- importação a partir de fontes oficiais). Não tem NENHUMA ligação a
-- contas de utilizador (profiles/auth.users) — é conteúdo, não conta.
--
-- Não existe hoje nenhuma forma de uma instituição "ter conta" e entrar
-- na plataforma como entidade parceira: só existe o registo individual
-- (profiles, via /registo).
--
-- Em vez de inserir diretamente em "entidades" (tabela curada, com
-- import de fontes oficiais — arriscado deixar qualquer utilizador
-- autenticado escrever lá sem revisão), esta migration cria uma tabela
-- de PEDIDOS: um utilizador autenticado submete um pedido de associação
-- da sua entidade, que a equipa revê manualmente. A ligação real a
-- "entidades" (nova linha, ou associar a uma já existente via
-- entidade_id) fica para quando o pedido for aprovado — não implementado
-- nesta migration (não há ainda UI de revisão/aprovação para admins).
--
-- Deliberadamente NÃO implementa SSO institucional por domínio — só
-- pedido + entrada por password. Ver docs/PARCEIROS-ENTRADA.md secção
-- "Roadmap".

create table if not exists "public"."entidade_pedidos" (
  "id"                bigint generated always as identity primary key,
  "profile_id"        uuid not null references public.profiles(id) on delete cascade,
  -- Preenchido manualmente por um admin quando o pedido for aprovado e
  -- ligado a uma linha de "entidades" (nova ou já existente). Não é
  -- escrito por nenhum caminho de UI nesta fase.
  "entidade_id"       bigint references public.entidades(id) on delete set null,
  "nome_entidade"      text not null,
  "categoria_id"       bigint references public.categorias_entidade(id),
  "localizacao_texto"  text,
  "contacto_email"     text,
  "contacto_telefone"  text,
  "mensagem"           text,
  "estado"             text not null default 'pendente'
    check (estado = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text])),
  "resolvido_por"      uuid references public.profiles(id),
  "resolvido_em"       timestamp with time zone,
  "created_at"         timestamp with time zone not null default now(),
  "updated_at"         timestamp with time zone not null default now()
);

create index if not exists idx_entidade_pedidos_profile on public.entidade_pedidos using btree (profile_id);
create index if not exists idx_entidade_pedidos_estado on public.entidade_pedidos using btree (estado);

alter table "public"."entidade_pedidos" enable row level security;

drop trigger if exists entidade_pedidos_updated_at on public.entidade_pedidos;
create trigger entidade_pedidos_updated_at
  before update on public.entidade_pedidos
  for each row
  execute function public.handle_updated_at();

-- Um utilizador autenticado só pode criar/ver os seus próprios pedidos.
drop policy if exists "Utilizador cria o seu proprio pedido" on "public"."entidade_pedidos";
create policy "Utilizador cria o seu proprio pedido" on "public"."entidade_pedidos"
  for insert
  to authenticated
  with check (auth.uid() = profile_id);

drop policy if exists "Utilizador ve os seus proprios pedidos" on "public"."entidade_pedidos";
create policy "Utilizador ve os seus proprios pedidos" on "public"."entidade_pedidos"
  for select
  to authenticated
  using (auth.uid() = profile_id);

-- Administradores (profiles.is_admin) veem e gerem todos os pedidos —
-- preparado para uma futura página de revisão/aprovação.
drop policy if exists "Administradores gerem todos os pedidos" on "public"."entidade_pedidos";
create policy "Administradores gerem todos os pedidos" on "public"."entidade_pedidos"
  for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

grant select, insert, update on table "public"."entidade_pedidos" to "authenticated";
grant delete, insert, select, update on table "public"."entidade_pedidos" to "postgres", "service_role";
