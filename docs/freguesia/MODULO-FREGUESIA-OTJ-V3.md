# MÓDULO FREGUESIA — OTJ
## Especificação V3 — Consolidada após Análise Crítica

**Data:** 17 ago 2026
**Substitui:** `MODULO-FREGUESIA-OTJ-V2-AUDITADO.md` (mantido em arquivo como histórico)
**Documentos relacionados:** `ANALISE-CRITICA-MODULO-FREGUESIA-V2-20260817.md`, `DECISAO-000-PONTE-VERTICAIS.md`
**Estado:** Especificação de implementação — pendente da Decisão 000

---

# 1. VISÃO

O módulo **Freguesia** transforma cada freguesia numa porta de entrada para a sua comunidade: administração, paróquia, associações, comissões de festas, cultura, desporto, educação, economia, saúde (com destaque para Farmácias), turismo e eventos.

Princípio fundador (inalterado da V2):

> **Uma freguesia é um território. As entidades pertencem ou actuam nesse território. Os eventos acontecem num tempo e num lugar.**

Regra orientadora:

> **Uma única fonte de verdade para cada conceito, relações explícitas entre conceitos, e informação temporal tratada como informação temporal.**

---

# 2. PRINCÍPIOS ARQUITECTURAIS (revistos)

1. Auditar antes de criar.
2. Reutilizar antes de duplicar.
3. **Generalizar apenas quando existe necessidade real** (este princípio aplica-se também a esta spec — ver §4.2).
4. Separar dados permanentes de dados temporais.
5. Separar evento de organizador.
6. Reutilizar a hierarquia geográfica existente (`freguesias`, `municipios`, `localizacoes`).
7. Reutilizar `codigos_postais_geo` (196k CPs) para geocodificação de moradas — não criar geocodificação nova.
8. Não criar sistema paralelo de pesquisa.
9. Migrações em ficheiros SQL **versionados no repositório** (corrige a lacuna crítica do projecto: schema só no Supabase Cloud).
10. Preservar dados existentes; nunca recriar ficheiros existentes.
11. Toda a informação temporal importante deve ser datável.
12. Toda a informação crítica deve ter origem e data de verificação.
13. Ambiente de referência: **Linux** (caminhos e comandos POSIX; removidas as referências Windows da V2).

---

# 3. DECISÃO ESTRUTURAL PRÉVIA (bloqueante)

O OTJ já tem verticais com tabelas próprias: `restaurantes` (COMER), `alojamentos` (ALOJAMENTO), vendedores (Mercado da Terra). A relação entre estas tabelas e a nova tabela `entidades` **tem de ser decidida antes de qualquer migração**.

A decisão está formalizada em **`DECISAO-000-PONTE-VERTICAIS.md`**. A opção recomendada (Ponte) assume:

- As verticais continuam a ser fonte de verdade das suas fichas ricas (reservas, lógica própria).
- `entidades` guarda referência opcional (`ref_tabela`, `ref_id`) para a vertical correspondente.
- A página da freguesia lê `entidades`; ao abrir uma entidade com referência, navega para a ficha vertical.
- Nenhuma migração de dados das verticais no MVP.

---

# 4. MODELO CONCEPTUAL

## 4.1. Território

Reutilizar integralmente a hierarquia existente:

```text
Portugal → Distrito/Região Autónoma → Concelho → Freguesia → Lugar → Localização
```

**União de Freguesias (obrigatório desde o MVP):** desde a agregação de 2013, muitas freguesias oficiais são Uniões. A identidade comunitária (festas, ranchos, paróquias) permanece ligada às freguesias históricas. Por isso:

- As entidades e eventos podem associar-se a um **lugar/localidade** dentro da freguesia oficial;
- A página de uma União apresenta as freguesias históricas como secções próprias;
- Nunca diluir a Festa "de Aldeia de Cima" numa União anónima.

## 4.2. Entidade (com Estabelecimento colapsado)

Uma **Entidade** é uma organização, instituição, grupo ou actor identificável: Junta, Paróquia, Agrupamento de Escuteiros, Comissão de Festas, Rancho, Clube, Escola, Empresa, IPSS, Farmácia.

**Simplificação face à V2:** no MVP, cada entidade tem `localizacao_id` directo (padrão validado no COMER: `entidade.localizacao_id → localizacoes.id`). A tabela `estabelecimentos` **não é criada** até surgir o primeiro caso real multi-estabelecimento (<5% do universo rural). Quando surgir, a migração é trivial e está prevista: `estabelecimentos` herda a localização da entidade.

Campos nucleares de `entidades`:

- identificação: nome, slug, descrição, fotografias;
- classificação: `categoria_id` (ver §5);
- território: `freguesia_id`, `lugar` (texto opcional), `localizacao_id`;
- contactos públicos: telefone, email, website, canais;
- ponte: `ref_tabela`, `ref_id` (nullable — ver §3);
- qualidade: `origem`, `fonte_url`, `data_verificacao`, `estado` (rascunho / pendente / validado / publicado / desactualizado / arquivado);
- auditoria: `criado_por`, `atualizado_por`, timestamps.

## 4.3. Localização

Reutilizar `localizacoes`. Geocodificação de moradas novas: primeiro `codigos_postais_geo`, fallback Nominatim via `/api/geocode` (já implementado, commit f03c83a).

## 4.4. Evento

**Não existe sistema de eventos no OTJ** — o Calendário Lunar é computacional (algoritmo + almanaque JSON), não armazena acontecimentos. O sistema de eventos nasce neste módulo e é desenhado para servir também a **Camada 2 (Agenda Agrícola)**: uma única infra-estrutura temporal para todo o projecto.

Um **Evento** tem: nome, descrição, `entidade_organizadora_id`, `freguesia_id`, `lugar`, `localizacao_id` (opcional), `inicio`, `fim`, tipo, estado, metadados de qualidade.

Regra herdada da V2 (intocável): **a Comissão não é o evento.** Cada edição anual é um evento próprio, ligado à Comissão por relação `organiza`. Isto permite construir o arquivo histórico das festas — missão cultural do OTJ.

## 4.5. Período de serviço

Informação temporal operacional distinta de evento: Farmácia de Serviço, encerramento temporário, horário excepcional. Ver §7 e §8.

---

# 5. CATEGORIAS

- **Dados, não schema:** uma tabela `categorias` com hierarquia (`categoria_pai_id`), nunca uma tabela por categoria.
- O catálogo completo da V2 (~80 subcategorias, de "talho" a "serviço funerário") permanece válido como **vocabulário de referência** — ver V2 §6 em arquivo.
- **Semear a pedido dos dados:** só se criam as categorias que a freguesia piloto usa. Secções vazias ("Serviços Funerários (0)") transmitem abandono e são proibidas na página pública (blocos condicionais — §10).

---

# 6. RELAÇÕES ENTRE ENTIDADES

Tabela única `entidade_relacoes` (`entidade_origem_id`, `tipo`, `entidade_destino_id`), com **tipo fechado (ENUM)** para impedir deriva de vocabulário:

| tipo | exemplo |
|---|---|
| `pertence_a` | Escola → Agrupamento |
| `organiza` | Comissão → Festa 2026 (relação entidade→evento) |
| `participa_em` | Rancho → Festa 2026 |
| `possui` | Empresa → (futuro) Estabelecimento |
| `sediada_em` | Entidade → Localização |
| `actua_em` | Entidade → Freguesia adicional |
| `associada_a` | Paróquia → Igreja |

Novos tipos exigem migração deliberada — nunca texto livre.

---

# 7. HORÁRIOS — MODELO TRANSVERSAL

Um único modelo para todas as entidades (farmácias, restaurantes fora do COMER, juntas, lojas):

**`horarios`** (regular): `entidade_id`, `dia_semana`, `abre`, `fecha`, `ordem_periodo`.
- Múltiplos períodos no mesmo dia são a norma portuguesa (fecho para almoço): Segunda 09:00–13:00 + 14:00–19:00 = duas linhas.

**`horarios_excecoes`**: `entidade_id`, `inicio`, `fim`, `tipo` (feriado / sazonal / encerramento / extraordinário), `horario_aplicavel` (nullable = fechado), `origem`, `data_verificacao`.

Regra de resolução: excepção activa sobrepõe-se sempre ao horário regular.

---

# 8. FARMÁCIAS

## 8.1. Ficha e horários

Farmácia é uma entidade da categoria "Farmácia" com o modelo de horários do §7. Sem tabela própria.

## 8.2. Farmácia de Serviço — condicionada à fonte de dados

Modelo: `farmacia_servico` (`entidade_id`, `inicio`, `fim`, `territorio`, `origem`, `fonte_url`, `data_verificacao`, `estado`).

**Restrição operacional honesta (nova na V3):** as escalas de serviço são publicadas por Câmaras/ANF sem API pública fiável. Por isso:

- A funcionalidade **só entra em produção** se existir processo de alimentação assumido e documentado (manual para a freguesia piloto é aceitável, desde que documentado);
- A interface indica sempre `data_verificacao` e fonte;
- Informação com verificação > X dias é apresentada com aviso explícito de confirmação — **nunca como garantida** (regra de segurança informativa herdada da V2 §8.6);
- Se não houver fonte sustentável ao chegar à Fase C, a funcionalidade sai do MVP sem culpa (ver §12).

Consultas-alvo quando activa: Agora / Hoje / Amanhã / por data / próximas por localização.

---

# 9. DADOS: ORIGEM, ARRANQUE E MANUTENÇÃO

A V2 desenhou o contentor; a V3 desenha a torneira.

## 9.1. Arranque a frio (sequência assumida)

1. **Fase manual:** o administrador povoa a freguesia piloto (20–40 entidades). É trabalho editorial assumido, não um detalhe.
2. **Fase de reivindicação:** entidades reclamam fichas existentes (fluxo tipo "claim" com verificação de representante) — pós-MVP.
3. **Fase distribuída:** cada entidade gere a sua informação, com os papéis da arquitectura de permissões existente — estado final.

## 9.2. Seeds identificados

- `Contactos_freguesias.xlsx/ods` (no projecto): contactos das juntas → seed da categoria "Administração Pública" para todas as freguesias;
- `codigos_postais_geo`: geocodificação das moradas inseridas;
- Conhecimento local directo para a freguesia piloto (o QA dos dados é conhecer o terreno).

## 9.3. Qualidade

Estados: rascunho → pendente → validado → publicado → desactualizado → arquivado. Todo o registo crítico (contactos, horários, serviço) transporta `origem` + `data_verificacao`. Duplicados evidentes bloqueados por índice (nome normalizado + freguesia).

---

# 10. PÁGINA DA FREGUESIA

Rota `/freguesias/[slug]`. Blocos **condicionais** — só aparecem secções com dados:

```text
[NOME DA FREGUESIA]                       ← se União: sub-secções por freguesia histórica

Hoje na Freguesia                          ← Farmácia de Serviço (se activa) + próximos eventos
Conhecer                                   ← história, património, locais
Comunidade                                 ← Junta, Paróquia, Associações, Escuteiros, Comissões
Cultura e Desporto                         ← Ranchos, Bandas, Clubes
Educação                                   ← Escolas, Agrupamentos
Economia Local                             ← Indústria, Comércio, Serviços
Saúde e Apoio                              ← Farmácias, Saúde, Apoio Social
Visitar e Viver                            ← Comer (→ COMER), Dormir (→ ALOJAMENTO), Percursos
```

"Comer" e "Dormir" navegam para as verticais existentes via ponte (§3) — nunca duplicam listagens.

---

# 11. PESQUISA

Reutilizar o padrão de pesquisa existente. Filtros: território, categoria, estado, data (eventos), proximidade (via coordenadas). Perguntas-alvo: "farmácias em X", "eventos este fim-de-semana", "ranchos do concelho", "escolas do Agrupamento Y".

---

# 12. MVP — 6 CRITÉRIOS

O módulo está funcional quando, na freguesia piloto, for possível:

1. Consultar a página da freguesia;
2. Listar entidades por categoria;
3. Abrir ficha de entidade (contactos, morada geocodificada, horário regular);
4. Criar eventos ligados a entidades e vê-los em "próximos eventos";
5. RLS e permissões respeitadas (leitura pública, escrita restrita);
6. Zero duplicação com COMER/ALOJAMENTO (Decisão 000 implementada).

**v1.1:** excepções de horário + relações entre entidades.
**v1.2:** Farmácia de Serviço (se fonte de dados garantida — §8.2).
**v2:** reivindicação de fichas e gestão distribuída.

---

# 13. PLANO DE IMPLEMENTAÇÃO

```text
Fase 0 — DECISÃO 000 assinada (ponte com verticais)          ← bloqueante
Fase A — Auditoria de confirmação (respostas provisórias já
         registadas na Análise Crítica §5.2; confirmar no repo)
Fase B — Migração mínima VERSIONADA no repo:
         categorias, entidades, entidade_relacoes,
         horarios, horarios_excecoes, eventos
Fase C — Freguesia piloto povoada manualmente (20–40 entidades,
         usando os seeds do §9.2)
Fase D — Validação do ciclo completo (criação, edição, publicação,
         pesquisa, eventos, horários, permissões, anti-duplicação)
Fase E — Expansão: concelho → múltiplas freguesias → nacional
```

---

# 14. DECISÕES DELIBERADAMENTE ADIADAS

- Tabela `estabelecimentos` (até caso real multi-estabelecimento);
- Farmácia de Serviço em produção (até fonte de dados sustentável);
- Fluxo de reivindicação de fichas (pós-MVP);
- Fusão de registos duplicados (pós-MVP; MVP apenas bloqueia);
- Nomes finais de componentes e rotas internas (na Fase B, após auditoria).

---

# 15. OBJECTIVO FINAL

Cada freguesia portuguesa representada como uma **comunidade organizada, pesquisável e viva** — território, entidades, serviços, cultura, economia e acontecimentos ligados entre si — sem transformar o projecto numa colecção de tabelas isoladas, e com um processo de dados tão bem desenhado como o modelo que os guarda.
