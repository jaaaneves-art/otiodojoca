# Auditoria — Lup Imóveis (prompt + MVP React)

**Data**: 24/08/2026 às 12:38

---

## Contexto

Foram enviados três ficheiros: `LupImoveisPROMPT.md` (spec para uma IA construir a versão de produção em Next.js + Supabase) e dois zips, `LupImoveisMVP1.zip` e `LupImoveisMVP.zip`. Confirmado por `diff -rq`: **os dois zips são byte-a-byte idênticos** — é o mesmo projeto React + Vite + TypeScript + Tailwind ("lupimoveis"), duplicado.

> ⚠️ **Colisão de nome encontrada ao guardar este relatório.** `docs/LUP.md` e `docs/pendentes/RELATORIO-LUP-20260823.md` já existem no projeto — mas descrevem um módulo **completamente diferente**: "Lup" (de "loop") é o módulo de economia circular/excedentes alimentares (doação, venda simbólica e procura de comida/bens perecíveis — três ciclos: humano, animal, compostagem), construído em 23/08/2026 a partir do MVP standalone **SobraCiclo**, reaproveitando `marketplace_ads.module = 'lup'`. Não tem nada a ver com imóveis. "Lup Imóveis" (este relatório) usaria o mesmo prefixo de marca para um domínio totalmente diferente — se este módulo avançar, precisa de um nome que não colida com o "Lup" já em produção (o `module` já tem `'lup'` reservado para o outro). Ficheiro deste relatório nomeado `AUDITORIA-LUP-IMOVEIS-20260824.md` para já ficar distinto de `RELATORIO-LUP-20260823.md`.

Seguindo o princípio já estabelecido neste projeto ("auditar primeiro, construir depois"), esta sessão só analisou — nada foi integrado na plataforma Almanaque/OTJ.

## O que foi executado a sério (não só lido)

- `npm install` — falhou uma vez por instabilidade transitória do mirror interno (`405` num tarball do vite), sucesso à segunda tentativa. Não é um problema do código.
- `npx tsc -b` — **passa sem erros**.
- `npm run build` (`tsc -b && vite build`) — **build limpo**, 2647 módulos, `dist/` gerado em 1.46s.
- `npx oxlint` — **1 aviso** (não bloqueante): em `Listings.tsx`, `setFilters` dentro de um `useEffect` a sincronizar `useSearchParams` — padrão comum em React mas o linter sugere derivar o valor no render em vez de um efeito. Cosmético.

Conclusão sobre o MVP React em si: **código limpo e funcional como protótipo de UI**. Sem bugs de tipos, sem erros de build.

## O que o MVP React realmente é (e não é)

Cobre só as 5 rotas públicas do prompt (`/`, `/imoveis`, `/imovel/:id`, `/leiloes`, `/publicar`) — **não** existe `/dashboard`, autenticação, upload real de fotos, nem persistência. Confirmado ao ler o código:

- `Publish.tsx`: o submit só faz `setSubmitted(true)`. Não grava nada — nem em `localStorage`. Recarregar a página perde tudo.
- `PropertyDetail.tsx`: os lances (`handleBid`) só atualizam `useState` local. Sem backend, dois utilizadores nunca veriam o mesmo leilão a mudar.
- Imagens são gradientes CSS a partir de códigos de cor no mock (`property.images: string[]`), não fotografias reais.
- `districts` no mock só tem 10 dos 18 distritos de Portugal (faltam Beja, Bragança, Castelo Branco, Évora, Guarda, Portalegre, Viana do Castelo, Vila Real, e regiões autónomas). Cosmético, mas relevante porque o projeto já tem `Freguesias_Portugal_2026.xlsx` / `Concelhos_Portugal_2026.xlsx` como dados de referência reais.

Isto é normal e esperado para o que é — um mockup de front-end. **É útil como referência visual** (layout dos cards, painel de leilão, filtros, formulário de publicação), não como base de código a copiar para produção.

## O prompt para a versão de produção (Next.js + Supabase): conflitos com a arquitetura real da plataforma

Aqui está o problema principal, e é o mesmo tipo de problema já visto e resolvido nos leilões do Gran Bazar: o prompt foi escrito **sem conhecer o schema real da plataforma Almanaque/OTJ**, e propõe recriar de raiz coisas que já existem, testadas e corrigidas.

1. **Tabela `properties` nova, paralela a `marketplace_ads`.**
   A plataforma tem um princípio arquitetural explícito e documentado (`REGRAS-NEGOCIO.md`, `MODULO-01-ANUNCIOS.md`): *"Arquitetura única. Modelo de dados único. Reutilização máxima de código. Sem duplicação de funcionalidades."* Todos os anúncios (Gran Bazar, Mercado da Terra, etc.) vivem em `marketplace_ads` com um campo `type` que determina o comportamento. Criar `properties` como tabela separada repete o erro que o projeto já decidiu evitar — seria mais um módulo isolado a manter, com o seu próprio CRUD, RLS e pesquisa, em vez de "imóvel" ser mais um tipo de anúncio no motor único.

2. **`property_auctions` / `property_auction_bids` novas, paralelas a `marketplace_auctions` / `marketplace_auction_bids`.**
   Isto é o ponto mais sério. O motor de leilões genérico já existe, já foi auditado (8 propostas comparadas), implementado e corrigido a sério (`claude/AUDITORIA-AUCTION-ENGINE-V0.2.0.md`, `claude/RELATORIO-LEILOES-GRAN-BAZAR-20260823.md`) — com 7 correções concretas: idempotência de lances (`request_id` + índice único), RLS do dono restrita a `status='scheduled'` sem `DELETE`, `place_bid()` como função `SECURITY DEFINER` com `SELECT ... FOR UPDATE` (lock de linha, sem condição de corrida), política de leitura que continua a mostrar o leilão depois de terminar, conversão correta de fuso horário no `datetime-local`. Construir `property_auctions` do zero repetiria esse trabalho todo.

3. **`propertyAuctionService.placeBid()` do prompt reintroduz exatamente os bugs já corrigidos.**
   O serviço faz `select` → valida no cliente → `insert` do lance → `update` do preço atual, tudo com chamadas diretas `supabase.from(...)` a partir do browser, sem lock nenhum. Dois lances simultâneos podiam ambos passar a validação `amount < current_price + increment` antes de qualquer um escrever — a mesma condição de corrida que o `place_bid()` `SECURITY DEFINER` do Gran Bazar existe precisamente para evitar. Também não tem `request_id`/idempotência, por isso um reenvio de rede podia duplicar o lance. E escreve diretamente do cliente via `supabase-js`, contrariando a convenção já registada no projeto: *"chama o server action, nunca `supabase.rpc()`/escrita direta do cliente"*.

4. **Localização como texto livre (`country`, `district`, `municipality`, `parish`, `address`) em vez de FK para uma tabela de referência.**
   `claude/INSTRUCOES-CLAUDE.md` já define o padrão: *"Usar códigos postais como referência... Alojamentos e restaurantes usam `codigo_postal` como FK"*, apoiado em `localizacoes` (com latitude/longitude) e nos ficheiros `Freguesias_Portugal_2026.xlsx`/`Concelhos_Portugal_2026.xlsx`/`Contactos_freguesias.xlsx` já no projeto. Guardar distrito/concelho/freguesia como texto solto em `properties` ignora essa infraestrutura já pronta e reintroduz o problema (inconsistência de nomes, sem geolocalização) que a tabela `localizacoes` resolve.

5. **Imagens em `images JSONB` na própria tabela, em vez do padrão `marketplace_photos` + bucket `marketplace-images`.**
   O padrão real (visto em `actions-F9.ts`, `FASE5-FINAL.md`) é: upload para Supabase Storage, metadados numa tabela própria (`ad_id`, `storage_path`, `sort_order`), remoção que apaga dos dois sítios. Um array JSONB de URLs perde a ordenação/gestão que essa tabela já resolve.

6. **`profiles` nova.** Muito provavelmente já existe uma tabela de perfis/utilizador global partilhada por todos os módulos (Gran Bazar, Alojamento, Mercado da Terra usam autenticação comum) — não confirmei o nome exato porque não estava nos documentos pesquisados, mas vale a pena verificar antes de criar mais uma.

## Recomendação

Não implementar o schema/serviços do prompt tal como estão. Se for para avançar com "Lup Imóveis" a sério, o caminho consistente com o resto da plataforma é tratá-lo como mais um módulo sobre a infraestrutura existente, à semelhança do que foi feito para o Gran Bazar:

- "Imóvel" como um `type` (ou `details` estruturado) dentro de `marketplace_ads`, não uma tabela `properties` nova.
- Leilão de imóvel a usar `marketplace_auctions`/`marketplace_auction_bids` + `place_bid()` já existentes, não um motor novo.
- Localização via `localizacoes`/código postal, não campos de texto livre.
- Fotos via `marketplace_photos` + bucket `marketplace-images`, não JSONB.
- Escrita sempre por server action, nunca `supabase-js` direto do cliente para insert/update.

O MVP React enviado continua a valer a pena **como referência de desenho** — o painel de leilão, os cards, os filtros e o formulário de publicação são um bom ponto de partida visual para desenhar os componentes reais em cima do schema correto. O que não deve ser aproveitado é o modelo de dados nem os serviços Supabase do prompt.

## O que falta para decidir avançar

- Confirmar o nome exato da tabela de perfis/utilizador já existente.
- Decidir se "imóvel" cabe bem no vocabulário atual de tipos de anúncio (Venda, Compra, Troca, Aluguer, etc.) ou se precisa de campos extra suficientes para justificar tratamento próprio dentro do mesmo `marketplace_ads` (área, quartos, WC, ano de construção, estado do imóvel).
- Se sim, desenhar a migration de extensão (novo `type='imovel'`, campos no `details` JSONB ou colunas novas) em vez de escrever `properties` do zero.
