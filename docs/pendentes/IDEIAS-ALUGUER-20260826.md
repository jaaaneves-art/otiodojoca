# Ideias futuras — Aluguer (Imóveis e Viaturas)

**Data:** 2026-08-26
**Estado:** Backlog — definição ainda por fazer pelo Yos, não implementar ainda.

Duas funcionalidades novas pedidas em conversa, ambas ainda por especificar
em detalhe. Registadas aqui para não se perderem, seguindo o princípio já
estabelecido no projeto ("auditar/especificar primeiro, construir depois").

---

## 1. Aluguer social — módulo Imóveis

Pedido inicial: "colocar um aluguer social em imóveis".

Perguntado se seria (a) um arrendamento normal aberto a qualquer
utilizador (terceiro tipo de anúncio a par de Venda/Leilão, preço mensal +
contacto, sem critérios de eligibilidade), ou (b) habitação social/
subsidiada — ligada à infraestrutura de Entidades Parceiras (`docs/
PARCEIROS-ENTRADA.md`, `app/admin/entidades/`) já construída, só publicável
por Municípios/entidades, com critérios de eligibilidade (rendimento,
agregado familiar, etc.).

**Resposta do Yos:** ainda vai criar/definir isto — não decidido.

**Por decidir antes de implementar:**
- Quem pode publicar (qualquer utilizador vs. só entidades parceiras).
- Se precisa de critérios de eligibilidade/candidatura, ou é só um anúncio
  com preço mensal como o Gran Bazar/Imóveis já fazem para venda.
- Se deve viver dentro do módulo Imóveis existente (mais um `type` em
  `marketplace_ads`, seguindo o padrão de `venda`/`leilao` em
  `lib/imoveis/ad-types.ts`) ou merece módulo/fluxo próprio — depende
  sobretudo da resposta ao ponto anterior (se for restrito a entidades
  parceiras com candidatura, o fluxo de `entidade_pedidos` +
  `app/admin/entidades/` já construído pode servir de base).

## 2. Aluguer (B2B) — módulo Viaturas / StandGo

Pedido inicial: "um aluguer em automóveis" — depois esclarecido como tendo
uma "hipótese B2B".

Perguntado se seria (a) aluguer restrito a Stands (vendedores
profissionais, `tipoVendedor='Stand'` já existe em `lib/viaturas/
ad-types.ts`), (b) um fluxo dedicado empresa-a-empresa (stand aluga a
outra empresa/frota), ou (c) outra coisa.

**Resposta do Yos:** "mais abrangente", também ainda por desenvolver —
não decidido.

**Por decidir antes de implementar:**
- Quem pode publicar/alugar (só Stands, também particulares, ou
  especificamente B2B entre empresas).
- Se é um anúncio simples tipo Venda (preço por dia/mês + contacto direto,
  sem sistema de reservas) ou precisa de calendário de disponibilidade e
  reservas com datas — mais parecido com o módulo de Alojamento
  (`reservas_alojamento`) do que com Venda/Leilão de Viaturas.
- Como se relaciona com o `tipoVendedor` já existente (`Particular`/
  `Stand`) — se "aluguer" for só para Stands, pode nem precisar de um novo
  valor, só uma restrição de quem pode escolher esse `type`.

---

## Ficheiros relevantes para quando isto avançar

- `lib/imoveis/ad-types.ts`, `lib/imoveis/details.ts`,
  `supabase/migrations/20260824010000_imoveis.sql` — padrão de tipos de
  anúncio do módulo Imóveis.
- `lib/viaturas/ad-types.ts`,
  `supabase/migrations/20260824000000_viaturas.sql` — idem para Viaturas.
- `docs/PARCEIROS-ENTRADA.md`, `app/admin/entidades/` — infraestrutura de
  Entidades Parceiras, relevante só se "aluguer social" acabar por ser
  restrito a Municípios/entidades.
- `lib/alojamento/actions.ts`,
  `supabase/schemas/public/tables/reservas_alojamento.sql` — único
  precedente no projeto de um fluxo de reserva com datas/disponibilidade,
  relevante só se o aluguer de viaturas precisar de calendário.
