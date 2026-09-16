# Guião de teste — Marketplace (Gran Bazar, Mercado da Terra, Imóveis, Viaturas)

13/09/2026, 21:38, Europe/Lisbon (WEST, UTC+1). Branch `fix/lup-rpc-20260913`.
Valida a correção preparada em `docs/pendentes/20260913T2119-correcao-marketplace-4-modulos.md`
(migration `20260913232000_marketplace_ad_completo_rpc.sql`, já aplicada ao
Supabase local, + 8 páginas alteradas). Nada disto foi testado ainda — é o
que falta para poderes confiar no commit destas alterações.

Regista o resultado real de cada passo (✅/❌ + evidência) antes de decidires
commitar. Não declares nada como validado sem executares o passo.

## 0. Arrancar o Next.js contra o Supabase LOCAL

O `.env.local` normal do projeto não é para reutilizar aqui (aponta para o
Supabase remoto). Este script obtém URL/chave do Supabase local via
`supabase status` e recusa arrancar se não for mesmo local:

```bash
cd ~/Nextcloud/Projectos/otiodojoca

env_local="$(npx supabase status -o env 2>/dev/null)"
api_url="$(echo "$env_local" | grep '^API_URL=' | cut -d= -f2- | tr -d '"')"
pub_key="$(echo "$env_local" | grep -E '^(PUBLISHABLE_KEY|ANON_KEY)=' | head -1 | cut -d= -f2- | tr -d '"')"

if [[ "$api_url" != http://127.0.0.1:* ]]; then
  echo "ERRO: API_URL não é local (\"$api_url\") — não arranco o servidor."
  exit 1
fi
if [ -z "$pub_key" ]; then
  echo "ERRO: não encontrei ANON_KEY/PUBLISHABLE_KEY em 'npx supabase status -o env'."
  exit 1
fi

echo "A arrancar Next.js contra Supabase LOCAL ($api_url) — Ctrl+C para parar."
NEXT_PUBLIC_SUPABASE_URL="$api_url" \
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$pub_key" \
npm run dev
```

Deixa isto a correr num separador de terminal dedicado; usa outro separador
para os comandos `psql` de verificação abaixo. Site fica em
`http://localhost:3000` (confirma a porta que o `next dev` anunciar).

## 1. Pré-verificação: dados mínimos existem localmente?

Num segundo terminal, sem parar o passo 0:

```bash
cd ~/Nextcloud/Projectos/otiodojoca
db_url="$(npx supabase status -o env 2>/dev/null | grep '^DB_URL=' | cut -d= -f2- | tr -d '"')"

psql "$db_url" -c "select type, count(*) from public.categories where type in ('bazar','imoveis','viaturas') group by type;"
psql "$db_url" -c "select count(*) from public.marketplace_categories;"
psql "$db_url" -c "select count(*) from public.municipios;"
```

Se algum tipo vier a 0, diz-me antes de continuares — preparo o SQL de
seed mínimo (como se fez para as "3 categorias LUP" na integração
anterior) em vez de inventares dados na aplicação.

Precisas também de sessão iniciada como utilizador adulto de teste
(`/login` ou `/registo` no site local) — se não tiveres um, cria um agora.

## 2. Por módulo: criar, mudar de tipo, editar

Repete esta sequência para cada um dos 4 módulos. Substitui `<módulo>` por
`gran-bazar`, `mercado-da-terra`, `imoveis`, `viaturas`.

### 2.1 Criar um anúncio "venda" (ou equivalente com preço)

1. Abre `http://localhost:3000/<módulo>/novo`.
2. Preenche título, descrição, categoria, localização, contacto, preço.
   Viaturas: preenche também marca/modelo (o campo de texto do
   formulário, não precisas de escolher um ID de catálogo à mão).
3. Submete. Deve redirecionar para `/<módulo>/<id>` sem erro.
4. Confirma na BD (usa o `id` da URL de destino):

   ```bash
   psql "$db_url" -c "select id, module, type, price, price_type, contact_method, category_id, location, vehicle_make_id, vehicle_model_id from public.marketplace_ads where id = <id>;"
   ```

   Verifica: `module` = `<módulo>`, `price`/`price_type`/`contact_method`
   preenchidos como no formulário, `category_id` não nulo (exceto Imóveis
   tipo "quarto", que tem regra própria).

   **Viaturas apenas:** confirma `vehicle_make_id`/`vehicle_model_id` não
   nulos (o gatilho de catálogo deve tê-los resolvido a partir de
   `details.marca`/`details.modelo`).

### 2.2 Criar um anúncio "leilão" (gran-bazar, imoveis, viaturas — não existe em mercado-da-terra)

1. `/<módulo>/novo`, escolhe tipo "Leilão", preenche preço inicial e data
   de fim.
2. Submete e confirma:

   ```bash
   psql "$db_url" -c "select ad_id, start_price, minimum_increment, ends_at, status from public.marketplace_auctions where ad_id = <id>;"
   ```

   Tem de aparecer uma linha — confirma que o gatilho
   `gran_bazar_create_auction_if_needed` continua a disparar a partir da
   RPC (é o ponto mais arriscado desta correção: a RPC insere com
   `SECURITY DEFINER`, mas o INSERT em si é normal, o gatilho deve reagir
   da mesma forma).

### 2.3 Editar — mudar de tipo para confirmar que price/price_type ficam limpos

1. Abre `/<módulo>/editar/<id>` do anúncio "venda" criado em 2.1.
2. Muda o tipo para "Oferta"/"Troca"/"Procura" (o que existir no
   formulário do módulo) e grava.
3. Confirma:

   ```bash
   psql "$db_url" -c "select price, price_type, type, details from public.marketplace_ads where id = <id>;"
   ```

   `price` deve ficar `null`; `price_type` deve corresponder ao novo tipo
   (`null` para troca/procura, `free` para oferta). **Este é o
   comportamento que a RPC genérica partilhada (`marketplace_ad_editar`)
   não conseguia dar** — é o motivo de teres uma função dedicada; se isto
   não limpar corretamente, a correção tem um bug.

4. Edita outra vez só o título/descrição (sem mudar tipo) e confirma que
   gravou.

### 2.4 Ownership — outro utilizador não pode editar

Com uma segunda conta (ou sessão anónima), tenta abrir
`/<módulo>/editar/<id>` de um anúncio que não é teu. Deve redirecionar
para fora da página (o próprio `page.tsx` já faz este redirect antes de
chegar à RPC — confirma só que continua a acontecer).

## 3. Regressão — os 4 módulos já corrigidos hoje não podem ter partido

A migration de hoje só acrescentou funções novas, não tocou nas RPC
`marketplace_ad_criar`/`_editar`/`_apagar` já usadas por retailing, beleza,
mediação e consultório — mas vale a pena confirmar com um teste rápido:

1. Cria um estabelecimento em `/retailing/novo` (ou outro dos 4).
2. Confirma sucesso e — opcionalmente — edita-o.

Se isto falhar, o problema é novo e não estava nesta análise; para tudo e
avisa.

## 4. Lint, tipos, build

```bash
cd ~/Nextcloud/Projectos/otiodojoca
mkdir -p outputs

log="outputs/$(date +%Y%m%d-%H%M%S)-marketplace-4-modulos-lint-build.txt"
(
  echo "=== LINT ==="; npm run lint
  echo "=== TSC ==="; npx tsc --noEmit
  echo "=== BUILD ==="; npm run build
) > "$log" 2>&1
echo "Código de saída do último comando: $?"
echo "Registo: $log"
```

Confirma que não há erros novos nos 8 ficheiros alterados (erros
pré-existentes noutras partes do projeto não são desta correção).

## 5. Só depois de tudo isto — commit

Se todos os passos acima passarem, o próximo commit é só:

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
```

(`outputs/` continua fora, como sempre.) Volta a pedir-me o comando de
commit quando chegares aqui — atualizo a mensagem com o resultado real dos
testes acima, não com o que estava previsto.
