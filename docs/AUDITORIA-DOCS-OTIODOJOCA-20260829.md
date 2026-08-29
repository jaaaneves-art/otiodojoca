# Auditoria da pasta `docs/` — Projeto O Tio do Joca

**Data:** 29 de agosto de 2026, 12:45 (Europe/Lisbon)
**Âmbito:** `docs/` (499 ficheiros, 30 pastas) na cópia `/home/berze/Nextcloud/Projectos/otiodojoca`, com verificação cruzada contra `/home/berze/Nextcloud2/Projectos/otiodojoca`
**Método:** listagem recursiva completa (sem truncar) + leitura de amostra em cada pasta suspeita ou de risco

---

## 0. Nextcloud vs. Nextcloud2 — resolvido por inspecção directa do Git (actualização)

Esta secção foi corrigida depois de investigar mais a fundo. A primeira leitura (ficheiros com pastas diferentes em `app/`) sugeria um fork perigoso; a leitura dos objectos internos do Git mostrou que **não há fork nenhum por resolver** — é uma cópia local simplesmente desactualizada.

Não tendo acesso a um terminal neste dispositivo, li directamente os ficheiros internos do Git (`HEAD`, `refs/heads/main`, `FETCH_HEAD`, `refs/remotes/origin/main` e os objectos de commit, descomprimidos aqui) em ambas as cópias:

- `Nextcloud2` está parado no commit `2c53e6c` ("fix: troca/procura no Mercado da Terra..."), que é exactamente o que o GitHub tinha em 27/08. Nunca fez `git pull` desde então.
- `Nextcloud` fez `git pull` a 28/08 — commit `0118277f`, um merge normal entre o seu trabalho local e esse mesmo `2c53e6c` do GitHub ("Merge branch 'main' of .../otiodojoca") — e depois commitou mais trabalho de hoje (StandGo, Imóveis, Participar) no commit `749fcbb`. Esse `749fcbb` já está em `refs/remotes/origin/main` — **já foi enviado para o GitHub**.

Ou seja: `749fcbb` (Nextcloud) contém `2c53e6c` (Nextcloud2) na sua história — é um avanço linear, não um fork. `Nextcloud2` só está atrasado; não há trabalho dele que se perca.

A única pasta que sobra por explicar é `app/(freguesias)/`, que existe em `Nextcloud2` mas não em `Nextcloud`. Como o histórico é linear, isto só pode significar uma de duas coisas: (a) foi removida/renomeada para `(freguesia)` (singular, que existe nas duas) durante o merge de 28/08, ou (b) nunca chegou a ser commitada em `Nextcloud2` (pasta local solta). Nenhuma das duas é grave, mas vale a pena confirmar com um `git status` rápido em `Nextcloud2` antes de sincronizar, só por precaução.

**Ação recomendada, sem urgência:** corre `git pull` dentro de `~/Nextcloud2/Projectos/otiodojoca` para o pôr ao dia (deve ser um fast-forward limpo), ou passa a tratar só `~/Nextcloud/Projectos/otiodojoca` como a cópia de trabalho e ignora a outra. O Livro Branco v2.0 que criei está em `Nextcloud`, que — agora confirmado — é a cópia mais avançada e já sincronizada com o GitHub.

---

## 1. Panorama geral de `docs/`

499 ficheiros, quase todos Markdown, distribuídos por 30 pastas de categoria mais 21 ficheiros soltos na raiz. A maior parte das pastas de categoria (Core, architecture, Security, Governance, Community, Data, Deployment, Editorial, Functional, api, backend, frontend, devops, erd, sql, guides, infrastructure, manuals, product, qa, Technical, ux, freguesia) segue o mesmo padrão: um documento "manual" por área, dividido em 8 capítulos-tipo (Introdução → ... → Síntese), tudo gerado no mesmo dia — **18 de agosto de 2026**. É o mesmo método usado no `OTJ-WHITE-001` (Livro Branco) e no `OTJ-CORE-00X` (arquitetura conceptual): não é scaffolding morto, é documentação real e substancial (por exemplo, `Core/` sozinha tem 59 ficheiros e 135 KB, cobrindo os 7 documentos OTJ-CORE mencionados no Livro Branco). Este bloco não precisa de intervenção urgente — está consolidado e consistente internamente.

O problema não é "pastas vazias". É que este bloco de 18/08 ficou **congelado no tempo** face a tudo o que aconteceu depois.

---

## 2. Trabalho real dos últimos dias, fora da estrutura oficial

Duas pastas — `pendentes/` (12 ficheiros, 153 KB, 23–28/08) e `sessoes-cowork/` (2 ficheiros, 26–27/08) — contêm relatórios de sessão muito recentes e muito substanciais: auditorias reais ao código, com decisões tomadas, migrations aplicadas, erros de build corrigidos. Não são scaffolding — são o histórico de trabalho mais fiável que existe no projeto neste momento. Mas nenhuma das duas está referenciada no `OTJ-DOCUMENTATION-INDEX.md` nem no fluxo recomendado por esse índice.

Destes relatórios saiu também um achado de segurança (RISCO-01, `POST /api/seed` sem autenticação, service-role key exposta) — **correcção (29/08, 12:55):** ao ler o código actual em `app/api/seed/route.ts`, confirmei que já está corrigido (bloqueado fora de `NODE_ENV=development`, com o comentário a referenciar o próprio RISCO-01). A secção 17 do relatório completo (que só li agora na íntegra, não só o resumo) confirma: corrigido a 26/08, commitado e enviado para o GitHub a 27/08 (commit `1732bfe`). A mesma proteção foi replicada em `app/api/seed-stands-teste/route.ts`. O RISCO-02 (RLS aberta em `reservas_alojamento`) também consta como resolvido de ponta a ponta nessa secção, com migration e teste automatizado (Vitest) a proteger a correcção. Ficam por resolver, sem urgência: RISCO-03 (ficheiro `lib/supabase/marketplace.ts` provavelmente morto, candidato a remoção) e RISCO-04 (agendador do fecho de leilões do Gran Bazar não confirmado).

Ou seja, o item 2 da lista de recomendações abaixo **já está feito** — só não estava reflectido no resumo que eu tinha lido primeiro.

Este mesmo bloco de relatórios também revela que a plataforma já tem módulos em produção que **não constam em nenhum lado oficial** — nem no `README.md`, nem no `ROADMAP.md`, nem no Livro Branco que acabámos de consolidar: **Gran Bazar** (leilões), **Lup** (economia circular de excedentes), **Imóveis** (venda/leilão de imóveis), **Viaturas**, **Alojamento**, **Comer**, e o fluxo de **Entidades Parceiras**. Têm migrations aplicadas, build limpo e, nalguns casos, commits e push feitos. O Livro Branco v2.0 que fiz hoje enumera os módulos do ecossistema segundo o que os documentos oficiais diziam — e por isso já nasce desactualizado nesse ponto específico.

---

## 3. Ficheiros/pastas mortos ou mal arrumados

- **`investigations/RCA-Save-OpfState.md`** — 0 bytes (vazio), e o nome ("Save-OpfState") pertence ao projeto OPF, não ao O Tio do Joca. Ficheiro órfão, sem relação com esta pasta.
- **`camada-2/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md`** — 11,4 KB de conteúdo real (dados agrícolas extraídos do Volume IV do Almanaque para alimentar ~50 culturas), mas arquivado com o nome críptico "camada-2" dentro da documentação técnica da plataforma, em vez de junto do Almanaque ou de `sql`/`Data` onde alguém o encontraria.
- **`diagnosticos/LOCALIZACOES-LEVANTAMENTO.txt`** — 1,2 KB, um dump de `grep` de 14/08 sobre o módulo de localizações. Útil como nota pontual, mas é o único ficheiro nesta pasta — não justifica pasta própria.
- **`project-management/sessions/20260715_1949_site-o-tio-do-joca-PUBLICAR.zip`** — 962 KB, um backup de site completo dentro de uma pasta que devia conter apenas registos de sessão em Markdown (todos os outros ficheiros aí têm 100–3.000 bytes). Destoa em tamanho e em tipo.
- **Sobreposição:** `pendentes/RELATORIO-SESSAO-COWORK-20260826.md` (13.105 bytes) e `sessoes-cowork/RELATORIO-SESSAO-COWORK-20260826.md` (14.012 bytes) — mesmo dia, mesmo nome, tamanhos diferentes. Ou é a mesma sessão guardada duas vezes com pequenas diferenças, ou são coisas distintas com um nome mal escolhido — precisa de confirmação, não vou assumir.
- **Dois roadmaps incompatíveis:** `ROADMAP.md` (raiz, "Fases") e `docs/OTJ-ROADMAP.md` ("Sprints") — já sinalizado na conversa anterior, mantenho aqui para registo.
- **21 ficheiros soltos na raiz de `docs/`** (`GRAN-BAZAR.md`, `IMOVEIS.md`, `VIATURAS.md`, `LUP.md`, `PARCEIROS-ENTRADA.md`, `EMAIL-SENDGRID-CLOUDFLARE.md`, etc.) — na sua maioria documentação real e recente dos módulos novos referidos no ponto 2, mas sem pasta própria nem entrada no índice mestre.

---

## 4. Recomendação de arrumação (proposta, nada foi movido)

1. ~~Resolver a divergência Nextcloud vs. Nextcloud2~~ — **feito** (secção 0): não era um fork, o Nextcloud2 só precisa de um `git pull`.
2. ~~Corrigir o RISCO-01~~ (`/api/seed` sem autenticação) — **já estava feito** desde 26–27/08 (secção 2). Falta só, se quiseres, remover `lib/supabase/marketplace.ts` (RISCO-03, provável código morto) e confirmar o agendador de leilões do Gran Bazar (RISCO-04).
3. Criar uma pasta `docs/Modules/` (ou semelhante) para `GRAN-BAZAR.md`, `IMOVEIS.md`, `VIATURAS.md`, `LUP.md` e os relatórios correspondentes em `pendentes/`, e actualizar o `OTJ-DOCUMENTATION-INDEX.md` e o Livro Branco para os incluir na lista de módulos.
4. Fundir `pendentes/` e `sessoes-cowork/` num único histórico de sessões recentes (ou mover ambos para dentro de `project-management/sessions/`, que já existe para esse fim), resolvendo a duplicação do relatório de 26/08 primeiro.
5. Tirar o ZIP de 962 KB de `project-management/sessions/` para uma pasta de backups fora de `docs/`.
6. Apagar ou mover `investigations/RCA-Save-OpfState.md` (está vazio e é de outro projeto) e reclassificar `camada-2/` com um nome que se entenda (ex.: mover o ficheiro para `docs/Data/` ou para a documentação do Almanaque).
7. Escolher **um** roadmap (`ROADMAP.md` ou `OTJ-ROADMAP.md`) e arquivar o outro, actualizando-o com o estado real (Mercado da Terra, Gran Bazar, Lup, Imóveis e Viaturas já avançados, não "por fazer").

Não fiz nenhuma destas alterações — são de escolha tua, e a 1 e a 2 são mais urgentes do que as restantes.
