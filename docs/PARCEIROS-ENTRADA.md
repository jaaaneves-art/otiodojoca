# Entidades Parceiras — Entrada e Pedido de Associação

Ponto de entrada para utilizadores institucionais (Juntas de Freguesia,
Municípios, Cooperativas, Associações, Organizações de Produtores e
outras entidades/empresas parceiras) — a par do registo individual já
existente (`/registo`).

## 1. Porque não escreve directamente em "entidades"

Antes de mexer em código foi feita uma auditoria ao schema existente
(`supabase/schemas/public/tables/`). Conclusão:

- `public.entidades` já existe como **diretório curado**: workflow
  editorial `rascunho -> pendente -> validado -> publicado ->
  desactualizado -> arquivado`, com colunas `origem`, `fonte_url`,
  `data_verificacao`, `ref_tabela`/`ref_id` — típicas de um catálogo
  alimentado por importação de fontes oficiais e/ou curadoria manual.
- **Não tem nenhuma ligação a contas de utilizador.** Não existe
  `owner_id`/`profile_id` em `entidades`, nem uma tabela de membros
  ligando `profiles` a `entidades` (ao contrário do que documentos
  antigos do projeto, como `OTJ_Fase3_Capitulo9_Modelo_Relacional_
  Entidades_Institucionais`, já previam com `institution_members`).
- `entidade_relacoes` só liga entidades entre si (`parceiro_de`,
  `membro_de`, etc.), nunca a um utilizador autenticado.

Ou seja: hoje uma instituição não tem "conta" nenhuma — é só um registo
informativo no diretório. Dar-lhe uma forma de entrar como utilizador
implica ligar uma conta (`profiles`/`auth.users`) a uma linha de
`entidades`, e isso **não deve ser feito sem revisão**, porque
`entidades` é uma tabela curada/importada, não de auto-registo.

Por isso, em vez de deixar qualquer utilizador autenticado escrever
directamente em `entidades`, foi criada uma tabela nova e isolada:
**`public.entidade_pedidos`** (migration
`supabase/migrations/20260823010000_pedidos_entidade_parceira.sql`).
Um utilizador autenticado só pode inserir/ler os seus próprios pedidos;
administradores (`profiles.is_admin`) veem e gerem todos. A ligação real
a `entidades` (nova linha, ou associar a uma já existente via
`entidade_pedidos.entidade_id`) fica para quando o pedido for aprovado —
**não há ainda nenhuma página de revisão/aprovação para admins**, isso
fica para uma fase seguinte.

## 2. O que foi construído

- **Janela de boas-vindas na home** (`components/entidades/
  entry-choice-modal.tsx`): pergunta "Sou cidadão" ou "Sou entidade
  parceira" e encaminha cada um para o sítio certo. Só é montada para
  visitantes sem sessão (`app/page.tsx`, `{!user && <EntryChoiceModal />}`).
  Fica sempre acessível através do link fixo por cima da grelha de
  funcionalidades.
- **Novo cartão "Entidades Parceiras"** na grelha da home, a apontar
  para `/parceiros` — acesso permanente, não depende só da janela.
- **`/parceiros`**: página de explicação (entrada por password, nota
  sobre o roadmap de SSO institucional). Se autenticado, mostra 4 cartões
  — um por tipo de entidade (ver secção 2b); se não, CTA para login/registo.
- **Nota na página de login** (`app/(auth)/login/page.tsx`) a explicar
  que entidades parceiras entram com email + password, com nota sobre o
  SSO institucional futuro.

## 2b. Formulários individualizados por tipo de entidade

Inicialmente havia um único formulário genérico. Passou a haver um
formulário diferente por tipo, cada um só com os campos que fazem
sentido para esse tipo (migration
`supabase/migrations/20260823020000_pedidos_entidade_tipo_e_municipio.sql`,
que acrescenta `entidade_pedidos.tipo_entidade` — discriminador
`'municipio' | 'freguesia' | 'organismo_publico' | 'outro'` — mais
`municipio_id`, `cargo` e `nipc`):

- **`/parceiros/pedido/municipio`** (`partner-request-form-municipio.tsx`):
  `<select>` nativo com os 308 municípios (`public.municipios`, id +
  nome + distrito_regiao — a tabela é pequena, não precisa de
  autocomplete), cargo do requerente (Presidente da Câmara, Vereador...),
  contacto. `nome_entidade` é preenchido automaticamente
  ("Câmara Municipal de X").
- **`/parceiros/pedido/freguesia`** (`partner-request-form-freguesia.tsx`):
  reutiliza tal e qual o componente já existente
  `components/entidades/freguesias/freguesia-autocomplete.tsx` (~3000
  freguesias, por isso autocomplete e não `<select>`) — já tinha o
  callback `onFreguesiaSelect` pronto para isto. Pré-preenche
  email/telefone a partir do que já está registado em `freguesias`
  (`freguesias.email`/`freguesias.telefone`), sem sobrepor o que o
  utilizador já tiver escrito. Liga a `freguesia_id` (FK real), não a
  texto livre.
- **`/parceiros/pedido/organismo-publico`** (`partner-request-form-organismo.tsx`):
  para Direção Regional, Instituição de Ensino, Centro de Investigação,
  Casa do Povo, etc. — nome livre + `categorias_entidade` (mesma fonte
  do formulário genérico) + NIPC opcional + cargo.
- **`/parceiros/pedido`** (`partner-request-form.tsx`, já existia):
  passou a ser especificamente para "Outra entidade" — Associação,
  Cooperativa, Produtor, Empresa — continua com concelho/freguesia em
  texto livre (`localizacao_texto`) e `categorias_entidade`. Agora grava
  `tipo_entidade = 'outro'` explicitamente.

Município e Freguesia usam FK real (`municipio_id`/`freguesia_id`) por
já existirem tabelas geográficas fidedignas com esses dados; Organismo
Público e Outra Entidade usam `categorias_entidade` + texto livre por
não haver uma tabela equivalente para esses tipos.

## 3. Roadmap — SSO institucional (não implementado agora)

Planeado para uma fase futura, por indicação explícita de que não
precisava de ser tratado já:

- Login SSO restrito ao domínio de email institucional da entidade
  (ex.: `@camara-x.pt`, Google Workspace ou Microsoft 365 do domínio).
- Associação automática do utilizador que entra por esse domínio à
  respetiva `entidade`, em vez de depender só do pedido manual acima.
- Continuar a suportar email + palavra-passe como alternativa.

Depende de decisões ainda por tomar (que provedores de identidade
suportar, como validar a posse do domínio, etc.).

## 4. O que ficou deliberadamente por fazer

- **Página de revisão/aprovação de pedidos para admins** — hoje os
  pedidos só ficam visíveis na tabela (via RLS, para quem tem
  `is_admin = true`); não há UI. Sem isto, o fluxo de "aprovar e ligar a
  `entidades`" é manual, feito diretamente na base de dados.
- **Concelho/freguesia em texto livre no formulário "Outra entidade"**
  (`/parceiros/pedido`) — só os formulários de Município e Freguesia
  usam FK real (`municipio_id`/`freguesia_id`, via `FreguesiaAutocomplete`
  reutilizado, ver secção 2b); Associação/Cooperativa/Produtor/Empresa
  continuam com `localizacao_texto` livre, por não haver uma tabela
  geográfica fidedigna equivalente para associar automaticamente.
- **Fluxo de "reivindicar" uma entidade já existente no diretório**
  (`entidade_pedidos.entidade_id` já existe na tabela para suportar
  isto no futuro, mas não há nenhuma UI que o preencha ainda).
- **SSO institucional** — ver secção 3.
