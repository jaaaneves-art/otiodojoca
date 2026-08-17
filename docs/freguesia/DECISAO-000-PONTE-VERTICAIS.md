# DECISÃO 000 — PONTE ENTRE `entidades` E AS VERTICAIS EXISTENTES

**Data:** 17 ago 2026
**Estado:** ⬜ Proposta — aguarda decisão do responsável do projecto
**Bloqueia:** toda a implementação do Módulo Freguesia (Fase B)
**Contexto:** `ANALISE-CRITICA-MODULO-FREGUESIA-V2-20260817.md` §II.2.1

---

## O problema

O OTJ já tem verticais em produção com tabelas próprias e dados reais:

| Vertical | Tabela | Dados reais |
|---|---|---|
| COMER | `restaurantes`, `restaurante_reservas` | Sim (reservas) |
| ALOJAMENTO | `alojamentos`, `reservas_alojamento` | Sim (reserva confirmada) |
| Mercado da Terra | perfis de vendedores | Sim (anúncios) |

O Módulo Freguesia introduz a tabela genérica `entidades`. Quando a página de uma freguesia listar "Restauração" ou "Alojamento", **de onde vêm os dados?** Sem decisão explícita, o resultado por omissão são duas listas de restaurantes que divergem ao fim de um mês.

---

## Opções

### Opção 1 — PONTE ✅ (recomendada)

As verticais mantêm-se fonte de verdade das suas fichas ricas. `entidades` guarda uma referência opcional:

```sql
ref_tabela VARCHAR(50) NULL,   -- 'restaurantes' | 'alojamentos' | ...
ref_id     UUID NULL,
UNIQUE (ref_tabela, ref_id)
```

- Página da freguesia lê `entidades`; entidades com referência abrem a ficha vertical (reservas incluídas).
- Restaurantes/alojamentos existentes ganham um registo-espelho leve em `entidades` (nome, categoria, freguesia, ref) — criado por script, mantido por trigger ou sincronização no server action.
- Vendedores do Mercado da Terra: mesma ponte, quando fizer sentido.

**Prós:** nada parte; reservas intocadas; página da freguesia unificada; migração futura (Opção 2) continua possível.
**Contras:** um espelho para manter sincronizado (nome/estado); exige disciplina no ponto único de escrita (server actions das verticais).

### Opção 2 — MIGRAÇÃO

Mover `restaurantes` e `alojamentos` para dentro de `entidades` + tabelas de extensão (`entidade_restaurante`, etc.).

**Prós:** modelo puro, uma só fonte.
**Contras:** parte dois módulos em produção com reservas reais; reescreve server actions, formulários e páginas; semanas de trabalho sem valor visível para o utilizador. **Não fazer agora.** Fica documentada como evolução possível pós-v2.

### Opção 3 — IGNORAR (omissão)

Cada sistema vive a sua vida.

**Consequência:** duplicação imediata, listas divergentes, e o Risco 1 da auditoria V2 consumado. **Rejeitada.**

---

## Decisão

⬜ **Opção 1 — Ponte** (recomendada)
⬜ Opção 2 — Migração
⬜ Opção 3 — Ignorar

**Decidido por:** ______________  **Data:** ______________

---

## Consequências imediatas da Opção 1 (quando assinada)

1. A migração da Fase B inclui `ref_tabela`/`ref_id` em `entidades` desde o dia 1;
2. Script de espelho para os restaurantes e alojamentos existentes (uma vez);
3. Server actions do COMER/ALOJAMENTO passam a actualizar o espelho na criação/edição/arquivo (um ponto de escrita, sem sincronização bidireccional);
4. Regra de UI: blocos "Comer" e "Dormir" da página da freguesia navegam sempre para as verticais — nunca renderizam ficha própria.
