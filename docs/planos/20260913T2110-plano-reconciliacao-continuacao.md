# OTJ — Plano de continuação (reconciliação pós-LUP/Empregos)

- Data/hora: 13/09/2026, 21:10, Europe/Lisbon (WEST, UTC+01:00).
- Estado: **continuação da sessão em curso** (aberta desde 09:45 de hoje; a mudança de hora/dia não fecha sessão — fecho só por indicação do Yos). Este plano não substitui os anteriores de hoje (09:45, 17:38, 17:49); reconcilia-os com o registo intermédio das 20:55/20:56.
- Âmbito desta entrega: novo plano de sessão, escrito e gravado antes de qualquer execução, conforme instruções. Sem implementação, migrations, testes ou commit nesta entrega.

## Ambiente e limitação técnica desta continuação

Esta continuação corre numa sessão Cowork ligada ao computador do Yos apenas
por ponte de ficheiros (listar, ler, copiar/escrever), **sem shell remoto**.
Não há aqui `git`, `npm`, Supabase CLI nem `psql`. Consequências:

- Não foi possível correr `pwd` / `git rev-parse --show-toplevel` /
  `git branch --show-current` / `git status --short --branch` nesta sessão.
  Raiz do projeto confirmada por listagem de diretório da ponte
  (`.git`, `package.json`, `docs/`, etc. presentes em
  `/home/berze/Nextcloud/Projectos/otiodojoca`).
- Branch e estado assumidos a partir do ficheiro `estado-para-commit.txt`
  fornecido pelo Yos nesta conversa (gerado por outra sessão/terminal, não
  por esta): branch `fix/lup-rpc-20260913`, 10 ficheiros modificados, dezenas
  de ficheiros novos (migrations, testes, docs, `outputs/`). Não re-executado
  por esta sessão — tratado como snapshot fornecido, não como facto
  verificado por mim.
- Lint, testes, build e aplicação de migrations **não podem ser executados
  por esta sessão**. Qualquer validação da Secção 5 das instruções continua a
  depender de uma sessão com terminal (Claude Code local) ou do próprio Yos.
- Nesta sessão consigo: ler e editar ficheiros de código/documentação no
  computador do Yos, e devolver alterações préparadas para essa continuação
  os aplicar/validar.

## Ponto de partida (reconciliado)

### Fechado e validado nesta sessão (hoje, antes desta entrega) — não repetir

- **Segurança P0 (09:45–13 Set):** `SUPABASE_SECRET_KEY` rodada e chave antiga
  revogada pelo Yos; convergência de `e_admin()`/afins; TRUNCATE revogado em
  ~190 tabelas; naming de 260 policies padronizado. Commit `91700ec` e
  seguintes. Ver `docs/planos/20260913T0945-plano-sessao.md`.
- **Contradição Marketplace identificada às 17:49:** apesar do pendente dizer
  "RPC-only resolvido", `Lup`, `Gran Bazar`, `Mercado da Terra`, `Imóveis` e
  `Viaturas` ainda tinham INSERT/UPDATE direto nas páginas `novo`/`editar`.
  Priorizado diagnosticar e corrigir a começar por LUP
  (`docs/planos/20260913T1749-plano-continuacao-otj.md`).
- **LUP — RPC-only/idempotência concluído e validado** (branch
  `fix/lup-rpc-20260913`): criação/edição migradas para `lup_ad_guardar`;
  idempotência por `lup_request_id`; escrita direta bloqueada; testes focados
  17/17; E2E local real `LUP_E2E_OK` (auth/criação/idempotência/1 anúncio/
  escrita direta bloqueada). Ficheiros: `app/lup/novo/page.tsx`,
  `app/lup/editar/[id]/page.tsx`, `components/lup/lup-ad-form.tsx`,
  `lib/lup/save-ad.ts` (+teste), `supabase/migrations/20260913230000_lup_rpc_idempotente.sql`,
  `docs/Modules/Lup/LUP.md` e os dois docs de 19:40/19:54.
  **Pendência técnica conhecida, não bloqueante:** upload de fotografias e
  gravação do anúncio não formam uma transação única (possível anúncio sem
  foto ou objeto órfão no Storage). Documentado; não repetir a implementação
  RPC-only do LUP por causa disto — tratar como item à parte se/quando
  autorizado.
- **Empregos — RPC-only concluído e validado**: `job_admin_definir_estado`
  nova, `job_editar` alargada a todos os campos do formulário, `e_admin()`
  canónica instalada localmente, policies RPC-only em `jobs`. E2E
  `tests/e2e/rpc-only-writes.e2e.test.ts`: 10/10 (inclui ciclo
  publicar→pausar→fechar→reabrir→publicar, e cobre também Marketplace e
  Reservas nesse teste). Ficheiros: `app/admin/empregos/actions.ts`,
  `app/empregos/empresa/vagas/[id]/editar/page.tsx`, as duas migrations de
  22:00/22:10.
- Corrigida fixture do E2E (`age_verified` → `data_nascimento`, schema local
  atual) — rever antes do commit se pertence ao conjunto final.
- Ambiente de validação: Supabase **local** (Docker, API `127.0.0.1:54321`).
  Backup válido criado antes da integração LUP:
  `outputs/20260913-195222-lup-local-before-integration.dump` (o de 19:52:00
  ficou vazio/inválido, não usar). Nenhum `push`, `db push`, reset destrutivo
  ou alteração em produção nesta sessão.

### Não reconciliado / a confirmar (não assumir concluído nem assumir pendente sem verificar)

1. **Gran Bazar, Mercado da Terra, Imóveis, Viaturas** — o plano das 17:49
   apontava INSERT/UPDATE direto nestes quatro módulos como a mesma falha do
   LUP. O registo das 20:55/20:56 diz explicitamente para **não assumir** que
   precisam de nova implementação só por terem aparecido numa auditoria
   anterior, mas também não confirma que ficaram corrigidos — ficaram
   marcados como "a reconciliar antes de executar novamente". Estado real:
   **por confirmar nesta continuação**, por leitura do código atual antes de
   qualquer alteração.
2. **Escutismo** — analisado durante a sessão RPC-only, estado parcial;
   inscrição/adesão escritas, decisão de tutoria em aberto
   (`ESCUTISMO-20260904.md`). Não reiniciar do zero; confirmar o que já está
   escrito antes de continuar.
3. `supabase/tests/security/rls-policies-block.test.sql` — ficheiro obsoleto,
   já substituído, falta apagá-lo fisicamente (precisa de terminal, não desta
   sessão).
4. Seleção final dos ficheiros a incluir no commit desta branch (excluir
   `outputs/` e ficheiros soltos de análise) — por decidir quando houver
   terminal disponível.

### Fora do âmbito desta branch (P2/P3/P-final de `docs/pendentes/PENDENTES-20260913.md`, sem indicação para avançar agora)

Educação/Universidades (por escrever de raiz), OAuth social login,
StandGo/Autonex, DB diff declarativo, decisão 16–18 anos, hub do Marketplace
de serviços (retailing/beleza/mediação/consultório), código morto de
`lib/alojamento/actions.ts`. Não avançar sem indicação explícita.

## Próximo passo concreto

Dado que esta sessão não tem terminal, o próximo passo útil é escolher, de
entre o que **é** possível fazer só com leitura/edição de ficheiros:

1. Ler o código atual de Gran Bazar, Mercado da Terra, Imóveis e Viaturas
   (ações de criar/editar) para confirmar se ainda há INSERT/UPDATE direto, e
   preparar (sem aplicar) a correção equivalente à do LUP nos que
   confirmarem a falha.
2. Rever/organizar a documentação e pendências desta sessão (por exemplo,
   consolidar `PENDENTES-20260913.md` com o registo das 20:55/20:56, sem
   apagar histórico).
3. Outra tarefa indicada pelo Yos.

Este plano fica gravado antes de iniciar qualquer uma destas opções.
