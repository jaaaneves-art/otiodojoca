# LUP — correção da criação/edição para RPC-only

Data: 13/09/2026, 19:40, Europe/Lisbon (WEST, UTC+01:00).
Estado: **Evolução — código corrigido e contrato validado localmente; integração remota pendente.**
Branch: `fix/lup-rpc-20260913`, criada a partir de `main` / `6593ab6`, preservando todas as alterações herdadas de Empregos e documentação. Sem commit/push/deploy.
Plano de origem: `docs/planos/20260913T1749-plano-continuacao-otj.md`.

## Contradição confirmada e inventário

A afirmação histórica “marketplace_ads já 100% RPC” cobria quatro serviços em `lib/marketplace/{retailing,beleza,mediacao,consultorio}-actions.ts`, mas não os cinco marketplaces abaixo. A migration `20260913180000_fechar_bypass_marketplace_ads.sql` revoga INSERT/UPDATE/DELETE/TRUNCATE de authenticated. As páginas usavam o cliente da sessão, logo o DML é incompatível com essa migration.

| Área | Antes desta fase | RPC disponível / diferença | Estado depois desta fase |
|---|---|---|---|
| LUP | INSERT em `app/lup/novo/page.tsx`, UPDATE em `app/lup/editar/[id]/page.tsx` | Genéricas incompletas: criar não cobre module/preço/preço-tipo/contacto; editar não cobre tipo/preço/preço-tipo/contacto nem restringe module | Criar/editar passam por `lup_ad_guardar`; testes locais feitos, migration remota e integração por validar |
| Gran Bazar | INSERT/UPDATE nas páginas novo/editar | Mesmas diferenças genéricas; edição também tem escrita em leilão, e lances já usam RPC própria | Escrita direta na criação/edição de anúncios; não alterado |
| Mercado da Terra | INSERT/UPDATE nas páginas novo/editar, em `app/mercado-da-terra/actions.ts` e INSERT em `components/mercado-da-terra/new-ad-form.tsx` | Contrato genérico não transporta todos os campos atuais; confirmar chamadores dos caminhos legados antes de editar | Escrita direta; não alterado |
| Imóveis | INSERT/UPDATE nas páginas novo/editar, mais atualização de leilão no editar | Contrato incompleto; lances têm RPC própria, o que não corrige criação/edição | Escrita direta na criação/edição; não alterado |
| Viaturas | INSERT/UPDATE nas páginas novo/editar, mais atualização de leilão no editar | Também faltam IDs de marca/modelo/geração/variante ao contrato de criação | Escrita direta na criação/edição; não alterado |

Nenhuma das cinco áreas tinha uma RPC equivalente completa para trocar a chamada sem perda de campos. Existem operações parcialmente migradas nos módulos com leilões, mas isso não os classifica como criação/edição correta por RPC. Não foi localizada chamada literal upsert/delete de marketplace_ads nestes caminhos. Existem deletes/inserts em favoritos, escritas de mensagens/conversas, fotos e uploads: tabelas/operações diferentes, não abrangidas pela revogação específica de marketplace_ads. A pesquisa literal não prova ausência de código dinâmico.

Inventários completos: `outputs/20260913-191627-868467-lup-inventario.txt` e `outputs/20260913-193210-639040-lup-inventario-final.txt`.

## Confirmação da base configurada, sem escrita

GET do OpenAPI `/rest/v1/` do Supabase configurado: HTTP 200, em `outputs/20260913-193718-938231-lup-remote-schema.txt`. Só foram impressas as assinaturas das três RPC de interesse, sem chaves ou linhas de dados.

- `marketplace_ad_criar(p_title,p_description,p_type,p_details,p_location?,p_category_id?)`: existe e coincide com as limitações encontradas no SQL local.
- `marketplace_ad_editar(p_ad_id,p_title,p_description,p_category_id?,p_location?,p_details?)`: existe e coincide com o SQL local.
- `lup_ad_guardar`: não existe ainda no OpenAPI remoto.

Isto confirma o contrato remoto, **não** uma introspeção de grants nem uma reprodução de escrita em produção. O bloqueio DML foi reproduzido em PostgreSQL isolado com os grants relevantes, sem criar anúncios remotos.

## Fluxo LUP antes e depois

1. GET `/lup/novo` exige utilizador, carrega categorias `type=lup` e municípios. O formulário oferece oferta/venda/procura, título, descrição, ciclo, contacto, localização e campos de recolha. Mantidos página, desenho e opções.
2. `LupAdForm` converte datas locais para ISO UTC e envia ficheiros em FormData. Mantida esta conversão. A criação/edição usam agora a mesma função `lib/lup/save-ad.ts`, chamada pelas server actions das páginas.
3. Autenticação é verificada dentro do helper a cada chamada. A RPC repete auth.uid(), restrições existentes de menoridade e ownership + module=lup na edição. Não usa service role no fluxo da aplicação.
4. Validação no servidor: tipo/campos obrigatórios, categoria inteira positiva, contacto permitido, preço finito não negativo, quantidade positiva, datas válidas/ordenadas, UUID de pedido, contagem e bytes reais das imagens. Categoria pertencente ao LUP é verificada na BD. A RPC valida os campos também quando chamada diretamente. A quantidade zero anteriormente aceite pelo input é agora rejeitada como anúncio sem quantidade; o formulário pode ser alinhado visualmente numa revisão UX posterior.
5. Todas as imagens são validadas **antes** de gravar o anúncio. Antes, imagem inválida podia deixar uma linha criada e levar a duplicação ao tentar outra vez. Mantido limite de cinco imagens, 5 MB e allowlist JPG/PNG/WebP do utilitário existente.
6. RPC fixa author_id=auth.uid(), module=lup e status=active ao criar. Deriva free/fixed/null do tipo; preserva preço/contacto/details. Ao passar para procura, limpa preço e detalhes de recolha. Edição preserva estado existente e não permite alterar anúncio de outro módulo, mesmo do próprio autor.
7. Persistência de fotos mantém bucket `marketplace-photos` e tabela `marketplace_photos`, com cliente da sessão. São escritas diretas **de fotos**, não bypass do RPC-only de anúncios. Replay de criação não repete uploads. Falhas de upload/associação continuam best-effort, como antes: o anúncio pode ficar sem todas as imagens; não há transação entre Storage e PostgreSQL. Um replay não recupera automaticamente fotos em falta após interrupção. Validação integral do Storage real permanece pendente.
8. Erros esperados regressam ao formulário e aparecem em `role=alert`; falha de gravação não produz redirecionamento de sucesso. As páginas mantêm `redirect('/lup/<id>')` depois do resultado positivo, fora do tratamento de exceções do helper. O helper converte falhas inesperadas de rede em erro recuperável, sem capturar redirects Next.js.

## Idempotência e âmbito da migration

Nova migration **aditiva**, `supabase/migrations/20260913230000_lup_rpc_idempotente.sql`:

- Coluna nullable `lup_request_id` em marketplace_ads.
- Índice único parcial `(author_id,lup_request_id)` apenas para module=lup e chave não nula.
- Uma RPC `lup_ad_guardar(p_data jsonb,p_request_id uuid,p_ad_id integer DEFAULT NULL)`, retorna `(ad_id,created)`, cobre criar/editar LUP sem alterar assinaturas genéricas.
- Na criação, advisory lock transacional por autor/chave e consulta do anúncio já criado; reenvios devolvem o primeiro resultado e não alteram o payload original. O índice reforça a unicidade persistente.
- SECURITY DEFINER, search_path fixo, EXECUTE revogado de PUBLIC/anon e concedido a authenticated. Não devolve GRANT DML a ninguém.

Cliente: `useRef` bloqueia dois submits no mesmo ciclo antes do rerender; botão disabled/“A guardar…”; UUID criado na primeira tentativa e mantido nos retries do mesmo formulário. Recarregar/abrir um formulário novo inicia uma nova intenção; não existe deduplicação semântica entre anúncios idênticos com chaves diferentes. Idempotência cobre **criação de anúncios**, não a repetição de anexos em edições sucessivas.

Migration aplicada **apenas** às bases locais isoladas de teste. Nenhuma aplicação remota, alteração de migration antiga, remoção de dados ou deploy. A aplicação e esta migration devem ser entregues em conjunto: o código novo exige a RPC que o remoto ainda não tem.

## Validações e resultados

| Validação | Resultado / evidência |
|---|---|
| TypeScript completo `tsc --noEmit --incremental false` | PASS, sem diagnósticos: `outputs/20260913-193002-654868-lup-typescript-final.txt` |
| ESLint dos ficheiros LUP e testes TS/browser | PASS, sem avisos: `outputs/20260913-192941-656573-lup-lint-final.txt` |
| Testes existentes de Alojamento/Empregos/Espetáculos + novos LUP | 118/118 em 12 ficheiros: `outputs/20260913-192840-014180-lup-unit.txt`; usam duplos, sem chamadas de BD real |
| Bateria LUP final, incluindo erro inesperado de rede | 17/17: `outputs/20260913-193925-484373-lup-unit-final.txt` |
| SQL de contrato, permissões, edição, replay e concorrência | PASS: `outputs/20260913-193922-lup-sql-complete.txt`; oito chamadas concorrentes, mesmo id, só uma resposta created=true e só uma linha |
| Formulário real em Chromium, viewport 390×844 | PASS: `outputs/20260913-192959-596786-lup-browser.txt`; duplo submit imediato, botão/estado, erro, mesma chave no retry e datas UTC. A action é um duplo controlado |
| Diff revisto e `git diff --check` | Sem erros de whitespace; alterações funcionais só em LUP |
| Build | Não executado; TypeScript e testes focados concluídos, sem necessidade de gerar Almanaque/prebuild para provar contrato RPC |

Os testes SQL usam schema mínimo e doubles explícitos de auth/menoridade em **PostgreSQL real**, não uma cópia integral do schema remoto. Provam a lógica SQL, mas não validam triggers/constraints adicionais do ambiente real nem o sistema real de menoridade. O teste browser usa o componente verdadeiro, mas **não** é um E2E Next.js → Supabase/Storage. O redirecionamento mantém-se no código das páginas, não foi exercitado por este harness.

Testes reproduzíveis: `python3 tests/lup/run-sql.py` (Docker local, cria BD isolada, não a apaga), `node tests/lup/form.browser.mjs` (Chromium/Chrome local), `vitest run lib/lup/save-ad.test.ts`. O runner SQL guarda comando, stdin, pasta, stdout, stderr e código de cada processo. Bases de teste retidas, incluindo `otj_lup_rpc_test_20260913`, `otj_lup_rpc_test_20260913_193134` e `otj_lup_rpc_test_20260913_193922`.

Erros desta fase: inicialmente usei `StorageError.code`, inexistente no tipo; corrigido para `name`, TypeScript final passou. Aviso `any` preexistente no formulário eliminado usando `FieldName`. Sandbox bloqueou inicialmente .git, Docker, servidor loopback e DNS; comandos necessários repetidos com aprovação. A interrupção do utilizador ocorreu antes de executar o primeiro runner SQL: estado rechecado antes de retomar. Nenhum destes bloqueios é apresentado como falha funcional do OTJ.

## Próximo passo recomendado

Rever/aplicar a migration num ambiente de integração com schema completo e testar criação/edição reais via Next.js com conta adulta, outra conta e imagens. Confirmar grants, regras de menoridade, persistência dos campos, erros e redirect, antes de publicação. Não executar um db push em massa: existem duas migrations herdadas de Empregos cuja aplicação remota não foi revista nesta fase.

Só depois do resultado LUP ser apresentado e da decisão do utilizador avançar para o módulo seguinte. Gran Bazar, Mercado da Terra, Imóveis e Viaturas permanecem sem alteração nesta fase. Não declarar o Marketplace inteiro “RPC-only resolvido”.

## Validação E2E local final

Validação realizada contra o Supabase local real.

Resultado:

- autenticação: OK;
- criação através de `lup_ad_guardar`: OK;
- repetição com o mesmo `request_id`: idempotente;
- anúncios criados após repetição: 1;
- INSERT direto em `marketplace_ads`: bloqueado;
- resultado final: `LUP_E2E_OK`.

Foi igualmente validada anteriormente a bateria focada do helper LUP:
17 testes aprovados.

### Estado da fase

**Classificação: Evolução.**

A conversão do LUP para escrita RPC-only e a proteção contra submissões
duplicadas ficam concluídas e validadas localmente.

### Pendente conhecido

O armazenamento de fotografias não participa na mesma transação da gravação
do anúncio. O fluxo continua a ser:

1. guardar anúncio via RPC;
2. enviar ficheiro para Storage;
3. gravar metadados da fotografia.

Assim, uma falha entre estas operações pode deixar um anúncio sem fotografia
ou um objeto órfão no Storage. Esta questão fica registada para tratamento
posterior e não invalida a validação RPC-only concluída nesta fase.

Não foi efetuado `push`, `db push`, reset da base de dados ou alteração do
Supabase remoto/produção.
