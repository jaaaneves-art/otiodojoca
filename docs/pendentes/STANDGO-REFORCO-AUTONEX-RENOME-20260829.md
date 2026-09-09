# Pendente — Reforçar o StandGo com o AutoNex + escolher novo nome — atualizado 30/08/2026 09:41

## Atualização 30/08/2026 09:41 — vista de mapa implementada (2/3 concluído)

**Item 3 do plano (vista de mapa) implementado e escrito no repositório.** Mesma disciplina da atualização anterior: sem terminal ligado nesta sessão, verificado com `tsc --noEmit` antes de escrever — **falta ao Yos testar no browser (`npm run dev`)**.

Decisões tomadas:
- **Leaflet via CDN** (`unpkg.com/leaflet@1.9.4`), tal como o AutoNex — carregado dinamicamente no browser (`<script>`/`<link>` injetados num `useEffect`), **sem adicionar nenhuma dependência ao `package.json`**. Evita a necessidade de correr `npm install` sem poder verificar o resultado.
- **Tiles CartoDB "light_all"** (claras), não o tema escuro do AutoNex — consistente com a identidade visual já definida do StandGo (azul/slate), como já tinha ficado assente na secção anterior deste documento.
- **Coordenadas: sem geocodificação nova.** Reaproveitada a tabela `public.municipios`, que já tem `latitude`/`longitude` (RLS pública) — o campo `location` de cada anúncio já é gravado como `"Nome, Distrito"` pelo `MunicipioAutocomplete`, o que cruza diretamente com `municipios.nome + ", " + municipios.distrito_regiao`. Não foi preciso inventar nenhuma tabela ou base de coordenadas própria.
- Marcadores em formato de "pill" com o preço (estilo AutoNex), popup com título + preço + link para o anúncio, `fitBounds` automático aos anúncios visíveis. Título/preço escapados antes de entrar no HTML do popup do Leaflet (os anúncios são conteúdo de utilizadores).
- Anúncios sem `location` reconhecida em `municipios` (texto livre, morada diferente, etc.) ficam de fora do mapa mas continuam na lista — aviso claro no rodapé do mapa quando isso acontece.

Ficheiros:
- **Novo** `components/viaturas/viaturas-mapa.tsx` — o mapa em si (carregamento do Leaflet, marcadores, popups).
- **Novo** `components/viaturas/viaturas-resultados.tsx` — novo componente "use client" que envolve a grelha de cards existente e o mapa, com o toggle 📋 Lista / 🗺️ Mapa.
- **Editado** `app/viaturas/page.tsx` — troca o bloco antigo (grelha direta) pelo novo `<ViaturasResultados>`; adicionada a query a `municipios` e o cruzamento de coordenadas por anúncio.

**Plano original das 3 peças, agora completo em código** (autocomplete + chips/filtro marca + mapa). Falta só o teste no browser pelo Yos.

## Atualização 30/08/2026 09:11 — implementação (1/3 concluído)

**Item 1 do plano (autocomplete + chips + filtro por marca) implementado e escrito diretamente no repositório do Yos.** Sem terminal ligado ao computador nesta sessão, por isso não foi possível correr `npm run build`/`next lint`/testar no browser — os ficheiros foram verificados com `tsc --noEmit` num projeto TypeScript isolado (mesmas `compilerOptions` do `tsconfig.json` real, com stubs só para os módulos externos — Next.js, Supabase — que não fazem parte do que foi alterado) antes de serem escritos. **Falta ao Yos correr `npm run dev` (ou `npm run build`) e testar no browser antes de dar como fechado.**

Ficheiros:
- **Novo** `lib/viaturas/marcas-modelos.ts` — dataset de marcas/modelos adaptado do `cars-data.js` do AutoNex (50+ marcas, modelos principais de cada uma).
- **Novo** `components/viaturas/marca-modelo-autocomplete.tsx` — segue exatamente o padrão do `MunicipioAutocomplete` já existente (`components/mercado-da-terra/municipio-autocomplete.tsx`): dois inputs de texto livre com sugestões por baixo, nunca um `<select>` fechado — continua a dar para escrever uma marca/modelo fora da lista. Ao trocar de marca, limpa o modelo se este não pertencer à marca nova.
- **Editado** `components/viaturas/viatura-ad-form.tsx` — os dois `<input>` de texto simples de Marca/Modelo substituídos pelo novo componente.
- **Editado** `components/viaturas/viaturas-filtros.tsx` — acrescentado (a) um `<select>` de Marca no painel de filtros avançados (mesma lista do dataset), e (b) uma linha de **chips rápidos** por cima do painel — ⚡ Elétrico, 🔀 Híbrido, ⚙️ Automática, 📉 Até 50.000 km, 💶 Até 10.000 € — clicáveis, com estado ativo destacado, sem esconder atrás do "▼ Mais filtros".
- **Editado** `app/viaturas/page.tsx` — novo parâmetro de pesquisa `marca`, filtrado sobre `details.marca` (mesmo padrão já usado para `combustivel`/`caixa`), comparação sem distinguir maiúsculas/minúsculas.

**Por fazer (dos 3 itens do plano original):** vista de mapa com Leaflet (ainda não começada — a maior peça, envolve escolher fornecedor de tiles e georreferenciar as localizações dos anúncios). Ordenação/contagem de resultados já estava coberta no código existente, não precisou de alteração.

## Atualização 30/08/2026 08:55

**Nota técnica resolvida:** o `AutoNex-completo.zip` não se perdeu — estava guardado na pasta Transferências do computador do Yos, recuperado diretamente de lá nesta sessão (não foi preciso reenvio). O `StandGo-PROMPT.md` também.

### Plano concreto de reforço de UX (mapeado aos ficheiros reais do StandGo)

O StandGo real (Next.js/Supabase) já tem 5 tipos de anúncio (Venda, Leilão, Procuro Comprar, Ceder, Alugar — ver `claude/STANDGO-TIPOS-COMPRAR-CEDER-ALUGAR-20260828.md`) e o sistema de stands verificados com contacto direto. O AutoNex não traz nada disso (é só front-end de demo, sem esses conceitos) — o que vale a pena tirar dele é puramente UX de pesquisa/descoberta:

1. **Autocomplete marca → modelo.** O AutoNex tem uma base estática (`cars-data.js`) com 50+ marcas e os modelos principais de cada uma. Vale a pena adaptar este ficheiro (ou gerar um equivalente mais completo) como um dataset TypeScript em `lib/viaturas/`, e usá-lo em dois sítios: no formulário de anúncio (`components/viaturas/viatura-ad-form.tsx`, hoje provavelmente campos de texto livre para marca/modelo) e no filtro de pesquisa (`components/viaturas/viaturas-filtros.tsx`). Reduz erros de escrita e melhora a pesquisa por marca.
2. **Filtros com chips rápidos.** O AutoNex tem chips de um clique (elétricos, híbridos, SUVs, ≤10k€, ≤50k km, automática) além do painel de filtros completo. `viaturas-filtros.tsx` já separa por tipo de anúncio — vale a pena acrescentar uma linha de chips por cima do painel avançado para os filtros mais usados.
3. **Vista de mapa.** É a peça mais nova a trazer — o StandGo hoje não tem vista de mapa (só lista/grid). O AutoNex usa Leaflet 1.9.4 + tiles CartoDB/OSM (sem chave de API, grátis), com pins por preço, popup e `fitBounds` automático. Faz sentido como toggle lista/mapa em `/viaturas`, já que os anúncios têm localização (cidade) e os stands são geograficamente relevantes (útil também para `/viaturas/stands`, o diretório de stands verificados).
4. **Contagem de resultados em tempo real + ordenação mais rica** — o AutoNex tem isto já fino (mais recentes, preço ↑↓, menos km); confirmar que o StandGo atual já cobre isto ou se vale a pena alinhar.

**Não faz sentido copiar:** o tema dark do AutoNex (StandGo já tem identidade visual definida — azul `#2563eb` + slate, ver `StandGo-PROMPT.md`), nem o modal de "vender" simplificado (o StandGo já tem um fluxo completo em `/viaturas/novo` com os 5 tipos, mais rico do que faz sentido reduzir a um modal).

### Nome do módulo — short-list para discutir

O Yos não gosta de "StandGo". Notas de contexto: os outros módulos do OTJ têm nomes com sabor português/local, não em estilo startup anglófono — Gran Bazar (leilões), Lup (imóveis), Mercado da Terra, SobraCiclo — por isso a short-list evita o padrão "Auto+palavra inglesa" ou "...Go"/"...Hub" que o AutoNex e o próprio StandGo seguem.

| Nome | Porquê |
|---|---|
| **Garagem** | Palavra do dia a dia em PT-PT, direta, memorável, fácil de dizer ("vou à Garagem ver um carro"). Evita "auto"/"car"/"go" gastos noutros marketplaces. |
| **Rodalivre** | "Roda livre" — junta mobilidade + liberdade, soa a nome de marca sem ser genérico. |
| **AutoVizinho** | Liga-se à identidade "vizinhança"/hiperlocal do OTJ (freguesias, municípios) — reforça o ângulo de stands locais/verificados que já é o diferenciador do módulo. |
| **MeuStand** | Já estava na lista de alternativas do `StandGo-PROMPT.md` original — mantém a palavra "Stand" (já a que os comerciantes usam) mas tira o "Go". |
| **Kilómetro Zero** | Evoca "carro com pouco uso"/"novo início", distinto dos concorrentes; mais arrojado, pede validação de como soa em contexto de marketplace. |

Nada decidido — para discutir com o Yos.

### Próximo passo

Confirmar com o Yos: (1) qual nome (ou nenhum destes, propor outro), (2) se quer avançar já com o mapa/autocomplete/chips ou só um dos três, (3) prioridade relativa a este pendente vs. Fase 3 do módulo social.

---

# Documento original — 29/08/2026 23:51

**Não começar já — fica para amanhã.** (Estamos a meio da Fase 2 do módulo social; isto é uma frente separada.)

## O que fazer

1. Usar o projeto **AutoNex** (zip enviado pelo Yos nesta conversa, `AutoNexcompleto.zip` — front-end completo de marketplace de automóveis: autocomplete de marca/modelo com 50+ marcas, filtros avançados, vista de mapa com Leaflet, tema dark, HTML/CSS/JS vanilla sem backend) como referência/reforço de UX para o módulo **StandGo** já existente no OTJ (stands de automóveis verificados, contacto direto — ver `claude/STANDGO-STANDS-VERIFICADOS-CONTACTO-DIRETO-20260828.md` e `claude/STANDGO-TIPOS-COMPRAR-CEDER-ALUGAR-20260828.md`).
2. Não é para copiar tal e qual — é inspiração/reforço de UX (autocomplete, filtros, mapa) a integrar no StandGo real (Next.js/Supabase), não um site à parte.

## Contexto

- `claude/STANDGO-STANDS-VERIFICADOS-CONTACTO-DIRETO-20260828.md`
- `claude/STANDGO-TIPOS-COMPRAR-CEDER-ALUGAR-20260828.md`
- `supabase/schemas/public/tables/` — tabela `viaturas` já existe em produção (migration `20260824000000_viaturas.sql`, `20260828140000_stand_automovel_contacto_direto.sql`)
- Conteúdo completo do `PROMPT-AUTONEX.md` (funcionalidades, stack, estrutura de ficheiros, base de marcas) preservado na versão anterior deste documento no histórico do projeto.
