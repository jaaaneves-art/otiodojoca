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

## 2c. `/participar` — porta de entrada pública (sem login prévio)

Pedido seguinte do utilizador: uma página "Participar" / "Faça parte do
OTJ", pensada como porta de entrada oficial para Municípios e Freguesias,
com um wizard de 4 passos (Entidade / Responsáveis / Acesso / Confirmar)
e — mudança relevante — **sem exigir conta prévia**. Os formulários de
Município e Freguesia descritos na secção 2b exigiam login
(`profile_id not null`, RLS só para `authenticated`); o fluxo pedido
agora é Pessoa → Pedido → Validação → Acesso institucional, sem falar em
criar conta primeiro. Confirmado com o utilizador durante a implementação
que o "acesso institucional" referido no pedido é, precisamente, o SSO
institucional já previsto na secção 3 — ainda por implementar, mas é essa
a peça que vai dar acesso depois da validação, não um login prévio ao
pedido.

**Decisão de arquitetura tomada (com o utilizador):** em vez de manter
dois caminhos paralelos, `/participar` **substitui**
`/parceiros/pedido/municipio` e `/parceiros/pedido/freguesia` — esses
dois URLs continuam a existir mas passam a ser apenas um `redirect()`
para as novas rotas (ver abaixo), para não partir links já partilhados.
Os componentes antigos (`partner-request-form-municipio.tsx`,
`partner-request-form-freguesia.tsx`) ficam no repositório, sem serem
apagados, mas deixam de estar referenciados por nenhuma rota. Organismo
Público, Outra Entidade e Stand Automóvel **não são afectados** — mantêm
exactamente o fluxo autenticado da secção 2b.

**Follow-up — duas rotas dedicadas em vez de um único wizard com
selector de tipo:** a primeira versão tinha `/participar` como página
única, com um wizard de 4 passos cujo passo 1 pedia para escolher
Município ou Freguesia antes de mostrar os campos certos. O utilizador
pediu para separar isto em dois formulários próprios — e, entre as
opções apresentadas, escolheu explicitamente "Duas rotas dedicadas": `/participar` deixou de ter wizard e passou a ser só uma página de
escolha (Hero + indicadores de confiança + dois cartões grandes,
Município e Freguesia), e cada tipo ganhou a sua própria rota com o seu
próprio wizard completo de 4 passos, sem passo de escolha de tipo
(a rota já o determina):

- `/participar/municipio` → `ParticiparWizardMunicipio`
- `/participar/freguesia` → `ParticiparWizardFreguesia`

Os dois wizards partilham só as peças de interface comuns, agora em
`components/entidades/participar/participar-shared.tsx`
(`ProgressoPassos`, `Cabecalho`, `Campo`, `Resumo`, `SummaryRow`,
`PASSOS`, `EMAIL_REGEX`, `semAcentos`) — o estado do formulário, o
markup de cada passo e a submissão ficam cada um no seu componente,
sem um `tipo` partilhado nem passo de selector. O componente combinado
original (`participar-wizard.tsx`) fica no repositório, sem ser
apagado, mas deixa de estar referenciado por nenhuma rota — tal como
`/parceiros/pedido/municipio` e `/parceiros/pedido/freguesia`, que
passaram a fazer `redirect()` para as duas rotas novas em vez do antigo
`/participar?tipo=...`.

**Migration** `supabase/migrations/20260828160000_participar_registo_publico.sql`
(additiva):

- `entidade_pedidos.profile_id` passa a aceitar `null` (pedido público,
  sem conta). Continua a ser preenchido quando quem submete já tem sessão.
- Novas colunas: `morada`, `codigo_postal`, `localidade`, `website`,
  `presidente_nome`, `responsavel_nome`. `contacto_email` passa a ser
  usado como "email institucional" (normalizado para minúsculas).
- Trigger `validar_entidade_pedido_participar()` (`BEFORE INSERT`, só
  corre para `tipo_entidade in ('municipio','freguesia')` — os outros
  tipos e as `UPDATE`s feitas pela página de admin, que só tocam em
  `estado`/`resolvido_por`/`resolvido_em`, não passam por aqui, para não
  partir a aprovação de pedidos antigos sem `presidente_nome`): valida
  obrigatoriedade (`nome_entidade`, `presidente_nome`, `responsavel_nome`,
  formato de `contacto_email`) e, para Freguesia, que
  `freguesias.municipio` (texto) corresponde a `municipios.nome` do
  `municipio_id` indicado (comparação sem acentos/maiúsculas, via
  `unaccent`) — a tabela `freguesias` não tem FK numérica para
  `municipios`, só o nome em texto, por isso a validação da relação é
  feita no trigger em vez de uma FK directa.
- Índices únicos parciais (`municipio_id`/`freguesia_id`, onde
  `tipo_entidade` corresponde e `estado = 'pendente'`) — no máximo um
  pedido pendente por entidade; a UI mostra mensagem amigável no
  `23505`.
- RLS: política nova para `anon` (insert apenas, `profile_id is null and
  tipo_entidade in ('municipio','freguesia')`); política de
  `authenticated` actualizada para aceitar `profile_id` nulo também.
  Não há política de `select` para `anon` — um pedido não pode ser relido
  depois de enviado (o ecrã de sucesso usa só o estado já em memória no
  browser); os dados do responsável não ficam publicamente legíveis.

**Componentes novos:**

- `components/entidades/municipios/municipio-id-autocomplete.tsx` —
  autocomplete de Município **com id real** (procurar → lista → cartão
  de seleccionado), visual institucional (ícone 🏛️). O componente
  `municipio-autocomplete.tsx` já existente **não foi alterado nem
  reaproveitado**: só captura texto livre (sem id) e é usado no
  formulário de anúncios do marketplace para um campo de localização —
  mexer nele para lhe dar id partiria esse uso. Como `/participar` do
  pedido original pedia explicitamente um autocomplete com resultados em
  lista (não um `<select>`, ao contrário da decisão tomada na secção 2b),
  foi criado este componente irmão, com a mesma abordagem de interacção
  já usada e testada em `freguesia-autocomplete.tsx`.
- `components/entidades/freguesias/freguesia-autocomplete.tsx` —
  reutilizado tal e qual (não alterado), tal como na secção 2b. A API
  real deste componente não permite filtrar por `municipio_id` — por
  isso, ao contrário do desenho inicial do pedido (Município escolhido
  primeiro, depois Freguesia filtrada), a página faz o inverso: a
  Freguesia é a fonte da verdade, e o Município é **derivado**
  automaticamente do texto `freguesia.municipio` (por comparação sem
  acentos com `municipios.nome`) e mostrado como contexto de sómente
  leitura ("Freguesia de X"). Isto garante, já no frontend, que nunca
  existe "Freguesia de Município A associada a Município B" — o mesmo
  que o trigger do backend volta a validar de forma independente.
- `components/entidades/participar/participar-shared.tsx` — peças de
  interface partilhadas pelos dois wizards (ver follow-up acima).
- `components/entidades/participar/participar-wizard-municipio.tsx` e
  `participar-wizard-freguesia.tsx` — os 4 passos de cada tipo, cada um
  grava directamente em `entidade_pedidos` via `supabase-js` (mesmo
  padrão dos outros formulários deste projecto, sem API route
  intermédia — a validação "backend" fica a cargo do trigger + RLS +
  índices únicos acima). `participar-wizard.tsx` (combinado, com passo
  de escolha de tipo) fica no repositório mas já não é usado por
  nenhuma rota.
- `app/participar/page.tsx` — página de escolha: Hero "Faça parte do
  OTJ", indicadores de confiança, dois cartões (Município →
  `/participar/municipio`, Freguesia → `/participar/freguesia`), secção
  "Como funciona". Já não carrega municípios/freguesias — isso passou
  para as páginas dedicadas.
- `app/participar/municipio/page.tsx` e `app/participar/freguesia/page.tsx`
  — cada uma carrega no servidor só os dados que o seu wizard precisa
  (município uma lista de municípios; freguesia uma lista de freguesias
  + municípios, para a derivação automática) e passa-os ao respectivo
  wizard.

**Página de admin** (`app/admin/entidades/page.tsx`) actualizada para
mostrar `presidente_nome`, `responsavel_nome`, morada/código
postal/localidade/website, e para preferir `responsavel_nome` como nome
do requerente quando não há conta associada (pedido público).

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
