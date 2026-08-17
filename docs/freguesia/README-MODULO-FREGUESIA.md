# MÓDULO FREGUESIA — ÍNDICE DOCUMENTAL

**Última actualização:** 17 ago 2026

## Documentos activos (ler por esta ordem)

| # | Ficheiro | Papel | Estado |
|---|---|---|---|
| 1 | `DECISAO-000-PONTE-VERTICAIS.md` | Decisão bloqueante: relação entre `entidades` e COMER/ALOJAMENTO/Mercado | ⬜ Por assinar |
| 2 | `MODULO-FREGUESIA-OTJ-V3.md` | **Especificação em vigor** (consolidada após análise crítica) | ✅ Activa |
| 3 | `ANALISE-CRITICA-MODULO-FREGUESIA-V2-20260817.md` | Análise profunda da V2: contradições, lacunas, fundamentação das mudanças da V3 | ✅ Referência |

## Documentos em arquivo (histórico — não usar para implementar)

| Ficheiro | Papel |
|---|---|
| `MODULO-FREGUESIA-OTJ-V2-AUDITADO.md` | Especificação V2 (substituída pela V3). Mantém valor como catálogo completo de categorias (§6) |
| `AUDITORIA-MODULO-FREGUESIA-OTJ-V2.md` | Auditoria que originou a V2 |

## O que mudou da V2 para a V3 (resumo)

1. **Decisão 000 criada** — a V2 não respondia à coexistência com as verticais já em produção;
2. **Sistema de eventos assumido como novo** — o Calendário Lunar é computacional, não armazena eventos; o novo sistema é desenhado para servir também a Camada 2 (Agenda Agrícola);
3. **Estabelecimento colapsado em Entidade** no MVP (princípio "generalizar só com necessidade real" aplicado à própria spec);
4. **Farmácia de Serviço condicionada à fonte de dados** — sem processo de alimentação documentado, não entra em produção;
5. **União de Freguesias / lugar** obrigatório desde o MVP (realidade pós-2013);
6. **Tipos de relação fechados** (ENUM de 7 tipos) — sem texto livre;
7. **Categorias semeadas pelos dados**, não pelo catálogo de 80;
8. **MVP reduzido de 15 para 6 critérios** (os restantes distribuídos por v1.1/v1.2/v2);
9. **Secção nova sobre origem e manutenção dos dados** (arranque a frio, seeds: `Contactos_freguesias.xlsx`, `codigos_postais_geo`);
10. **Migrações SQL versionadas no repositório** como requisito, e resíduos Windows removidos.

## Próximo passo

Assinar a **Decisão 000** → só depois escrever a primeira migração (Fase B).
