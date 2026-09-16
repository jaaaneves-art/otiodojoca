# Guião de retomada — Marketplace 4 módulos (execução no Linux Mint)

15/09/2026, 23:14, Europe/Lisbon (WEST, UTC+1). Branch `fix/lup-rpc-20260913`
(a verificar com `git branch --show-current` na máquina Linux).

Executa os passos abaixo **na máquina Linux Mint**
(`~/Nextcloud/Projectos/otiodojoca`), onde há shell real (git, npm, psql,
Supabase local). A correção das 8 páginas já foi aplicada numa cópia e
entregue em `otiodojoca-correcao-20260915.zip` (Transferências) — este
guião começa por a pôr no sítio e valida tudo antes do commit.

Regista o resultado real de cada passo (✅/❌ + evidência) antes de
decidires commitar. Não declares nada como validado sem executares o
passo. Alternativa recomendada: dar este guião ao Kimi Code CLI
(`kimi`), que executa e regista localmente.

## 0. Colocar a correção no sítio

```bash
cd ~/Nextcloud/Projectos/otiodojoca

# o ZIP está em Transferências; ajusta o caminho se estiver noutro sítio
unzip ~/Transferências/otiodojoca-correcao-20260915.zip

# confirma que as 8 páginas ficaram a chamar as RPC novas
grep -rln "marketplace_ad_criar_completo" app/
```

**Aceitação:** o `grep` lista os 4 ficheiros `*/novo/page.tsx` (gran-bazar,
mercado-da-terra, imoveis, viaturas). Se listar menos ou nenhum, o ZIP
não extraiu como devia — para e verifica.

**Verificação Git** (agora possível, na máquina real):

```bash
git branch --show-current
git status --short | head -20
```

Confirma que estás na branch de trabalho e vê quais dos 8 ficheiros o Git
deteta como modificados.

## 1. Lint, tipos, build

```bash
cd ~/Nextcloud/Projectos/otiodojoca
mkdir -p outputs

log="outputs/$(date +%Y%m%d-%H%M%S)-marketplace-4-modulos-lint-build.txt"
(
  echo "=== LINT ==="; npm run lint
  echo "=== TSC ==="; npx tsc --noEmit
  echo "=== BUILD ==="; npm run build
) > "$log" 2>&1
echo "Registo: $log"
```

**Aceitação:** sem erros novos nos 8 ficheiros alterados. Erros
pré-existentes noutras partes do projeto não são desta correção — marca-os
como pré-existentes com evidência (ex.: `git stash` + repetir o comando +
`git stash pop` se houver dúvida).

## 2. Supabase local + migration (com backup)

```bash
cd ~/Nextcloud/Projectos/otiodojoca
supabase start   # se já estiver a correr, ignora o aviso

dump="outputs/$(date +%Y%m%d-%H%M%S)-marketplace-before-migration.dump"
supabase db dump --data-only > "$dump" 2>/dev/null || \
  pg_dump -Fc "$DB_URL_LOCAL" -f "$dump"
echo "Backup: $dump"
```

Aplicar a migration:

```bash
# opção preferida (CLI aplica migrations pendentes por ordem)
supabase db push --local 2>/dev/null || supabase migration up --local
```

Se o histórico local de migrations estiver fora de sincronia com o schema
(realidade documentada a 13/09 — algumas migrations foram aplicadas via
`psql`), aplica o ficheiro diretamente e recarrega o schema do PostgREST:

```bash
db_url="$(npx supabase status -o env | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')"
psql "$db_url" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260913232000_marketplace_ad_completo_rpc.sql
psql "$db_url" -c "NOTIFY pgrst, 'reload schema';"
```

**Aceitação:**

```bash
psql "$db_url" -c "select proname from pg_proc where proname in ('marketplace_ad_criar_completo','marketplace_ad_editar_completo');"
```

Tem de aparecer **as duas funções**.

## 3. Guião de teste funcional

Seguir exatamente o
`docs/pendentes/20260913T2200-guiao-teste-marketplace-4-modulos.md`
(arranque do Next.js contra o Supabase local, pré-verificação de dados,
e por módulo: criar "venda", criar "leilão" onde exista, editar mudando
de tipo, ownership).

**Pontos de atenção desta correção em concreto:**

- 2.2 leilão: confirmar que o gatilho `gran_bazar_create_auction_if_needed`
  continua a disparar a partir do INSERT feito dentro da RPC
  (`SECURITY DEFINER`) — é o ponto mais arriscado da correção.
- 2.3 editar: `price` deve ficar `null` e `price_type` atualizado conforme
  o novo tipo — comportamento que a RPC genérica não dava e que motivou a
  função dedicada.
- Viaturas (2.1): `vehicle_make_id`/`vehicle_model_id` resolvidos pelo
  gatilho a partir de `details.marca`/`details.modelo`.

## 4. Só depois de tudo isto — commit

Se todos os passos passarem, o commit é:

```
supabase/migrations/20260913232000_marketplace_ad_completo_rpc.sql
app/gran-bazar/novo/page.tsx
app/gran-bazar/editar/[id]/page.tsx
app/mercado-da-terra/novo/page.tsx
app/mercado-da-terra/editar/[id]/page.tsx
app/imoveis/novo/page.tsx
app/imoveis/editar/[id]/page.tsx
app/viaturas/novo/page.tsx
app/viaturas/editar/[id]/page.tsx
docs/pendentes/20260913T2119-correcao-marketplace-4-modulos.md
docs/pendentes/20260915T2314-guiao-retomada-marketplace-linux.md
docs/sessions/20260915T2314-estado-intermedio-sessao.md
docs/planos/20260915T2010-plano-sessao.md
REGISTO-SESSOES-IA.md
```

(`outputs/` continua fora, como sempre.)

**Push não autorizado** — só com indicação explícita do Yos.

## 5. Resultados e registo

Preenche antes de fechar esta tarefa:

- [ ] Passo 0 (extração + grep): ✅/❌ — evidência:
- [ ] Passo 1 (lint/tsc/build): ✅/❌ — registo em `outputs/`:
- [ ] Passo 2 (migration aplicada + 2 funções visíveis): ✅/❌
- [ ] Passo 3 (guião 20260913T2200 completo nos 4 módulos): ✅/❌
- [ ] Commit feito (hash): 
- [ ] Registo atualizado em `REGISTO-SESSOES-IA.md`: ✅/❌

Data de conclusão real: ____/____/______

---

Nota: este guião **substitui** a parte de execução do plano de retomada
de 14/09 (`20260914T1209-plano-retomada.md`) para estes 4 módulos, porque
o estado real divergia do que esse plano assumia (H2 confirmada em
15/09). Manter os dois para histórico; trabalhar por este.
