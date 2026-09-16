# OTJ — Plano de sessão (retomada)

- Data/hora: 14/09/2026, 12:09, Europe/Lisbon (WEST, UTC+1).
- Estado: **continuação da sessão aberta desde 13/09/2026 09:45** (secção 6
  das instruções: mudança de dia não fecha sessão; fecho só por indicação do
  Yos). Não substitui os planos de ontem (09:45, 17:38, 17:49, 21:10);
  reconcilia-os com `REGISTO-SESSOES-IA.md` (entrada 21:10–22:10) e com o
  guião de teste do Marketplace.

## Ambiente e limitação técnica desta sessão

Sessão Cowork ligada ao computador (`berze-optiplex-5050`) apenas por ponte
de ficheiros (listar, ler, copiar/escrever na pasta autorizada). **Sem shell
remoto** — não há aqui `git`, `npm`, `psql` nem Supabase CLI. Mesma
limitação da sessão de ontem, 21:10–22:10.

- Pasta do projeto confirmada por listagem de diretório (não por
  `pwd`/`git rev-parse`): `.git`, `package.json`, `docs/`, etc. presentes em
  `/home/berze/Nextcloud/Projectos/otiodojoca`.
- Branch e estado assumidos a partir dos registos escritos (não verificados
  por `git` real nesta sessão): branch `fix/lup-rpc-20260913`; commit
  `616155b` (LUP + Empregos, 25 ficheiros) já feito a 13 Set; Marketplace
  (migration `20260913232000` + 8 páginas + doc) deliberadamente fora desse
  commit, ainda por validar.
- Lint, testes, build e aplicação de migrations não podem ser executados por
  esta sessão — dependem do teu terminal ou de uma sessão com shell local.

## Ponto de partida (reconciliado)

### Fechado e validado — não repetir

- **Segurança P0 (13 Set), completo:** `SUPABASE_SECRET_KEY` rodada e
  revogada, `CRON_SECRET` rodado, TRUNCATE revogado em ~190 tabelas, naming
  de 260 policies padronizado. Commit `6593ab6`, push feito
  (`6455ecf..6593ab6`).
- **LUP — RPC-only/idempotência:** concluído e validado (testes focados
  17/17, E2E local `LUP_E2E_OK`). Pendência não bloqueante: upload de fotos
  e gravação do anúncio não são uma transação única.
- **Empregos — RPC-only:** concluído e validado (E2E 10/10, ciclo
  publicar→pausar→fechar→reabrir→publicar).
- **Commit `616155b` (13 Set):** LUP + Empregos, 25 ficheiros — feito.
- **E2E geral** `tests/e2e/rpc-only-writes.e2e.test.ts`: 10/10 (cobre Jobs,
  Marketplace parcial, Reservas).

### Em curso — retomar exatamente aqui: Marketplace (Gran Bazar, Mercado da Terra, Imóveis, Viaturas)

- Diagnóstico confirmado por leitura de código: as 8 páginas `novo`/`editar`
  destes 4 módulos faziam INSERT/UPDATE direto em `marketplace_ads`,
  partido pela migration `20260913180000` (fecho RPC-only).
- Correção preparada e escrita em disco (confirmado por data de
  modificação dos ficheiros): migration
  `supabase/migrations/20260913232000_marketplace_ad_completo_rpc.sql`
  (`marketplace_ad_criar_completo`/`_editar_completo`) + 8 páginas
  alteradas para chamar a RPC nova.
- Migration **já aplicada** ao Supabase local via `psql` direto (fora do
  fluxo `supabase migration up`) — funções confirmadas por `\df`. Foi
  preciso `NOTIFY pgrst, 'reload schema';` manual à parte (nota para o
  futuro, já registada: fazer sempre isto depois de aplicar por `psql`
  direto, ou o PostgREST devolve 500 "function not found in schema cache"
  mesmo a função existindo).
- Guião de teste pronto e não repetir a preparação:
  `docs/pendentes/20260913T2200-guiao-teste-marketplace-4-modulos.md`.
- **Teste manual em curso, não concluído:** 1º teste (criar anúncio em
  Mercado da Terra) apanhou o erro de cache acima; `NOTIFY` já dado;
  reteste ainda por confirmar.
- Falta, pelo guião: reteste Mercado da Terra; completar os 4 módulos
  (criar, mudar de tipo → confirmar `price`/`price_type` a `null`, leilão
  onde existe, ownership); regressão rápida em
  retailing/beleza/mediação/consultório; `npm run lint`, `npx tsc --noEmit`,
  `npm run build`; só depois, commit (lista de ficheiros já definida no
  guião).
- **Não repetir** o diagnóstico nem recriar a migration/páginas — já feito.

### Pendências reais conhecidas (não bloqueantes; não agir sem indicação)

- LUP: atomicidade fotografia/anúncio (Storage não transacional).
- Escutismo: estado parcial, não reconciliado nesta continuação.
- `supabase/tests/security/rls-policies-block.test.sql`: obsoleto, falta
  apagar fisicamente (precisa de terminal).
- `app/mercado-da-terra/actions.ts` (`createAd`/`updateAd` diretos): não
  confirmado se ainda é importado por alguma página — verificar antes de
  decidir apagar ou corrigir.
- Itens fora do âmbito desta branch (Educação/Universidades, OAuth social
  login, StandGo/Autonex, DB diff declarativo, decisão 16–18 anos, hub de
  serviços do Marketplace): não avançar sem indicação explícita.

## Restrições mantidas

- Sem `push` sem autorização explícita para o âmbito em causa.
- Sem `db push`, reset destrutivo ou alteração em produção.
- Não repetir migrations, auditorias ou testes já aprovados sem alteração
  posterior que justifique nova validação.

## Próximo passo concreto

Esta sessão não tem shell, por isso a decisão de por onde continuar é do
Yos:

1. Retomar o guião de teste do Marketplace (reteste de Mercado da Terra a
   seguir ao `NOTIFY`) no teu terminal — dou os comandos exatos e registo o
   resultado real que devolveres.
2. Trabalho só de ficheiros que eu possa fazer diretamente por aqui (ex.:
   confirmar se `app/mercado-da-terra/actions.ts` ainda é importado, rever
   ou consolidar documentação/pendências).
3. Outra prioridade indicada agora.

Este plano fica gravado antes de escolher.
