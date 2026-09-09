# PENDENTES — Operadores Transporte Internacional de Autocarros
**Data:** 07 de Setembro de 2026  
**Módulo:** VIAGENS (Emigração)  
**Prioridade:** MÉDIA  
**Estado:** ⏳ Aguardando contacto IMT

---

## Contexto

Durante a sessão de 07-Set identificou-se a necessidade de levantar uma lista completa de operadores portugueses (e associados) que operam rotas internacionais regulares de autocarros. A lista não é publicamente disponível de forma consolidada.

**Utilizador mencionou:** Anpian, Barquense, Lazara (operadores pequenos/médios não-FlixBus)

---

## Pendências por Prioridade

### 🔴 P1 — BLOQUEANTE

#### 1.1 Contactar IMT para Lista Oficial
- **O quê:** Solicitar lista de operadores com autorização para serviços regulares internacionais
- **Onde:** Instituto da Mobilidade e Transportes (imt-ip.pt)
- **Como:** Email `contacto@imt-ip.pt` + telefone (verificar site)
- **Resultado esperado:** CSV/Excel com operadores + autorizações
- **Tempo:** 5–10 dias úteis
- **Responsável:** Yos (preferência) ou automação de contacto
- **Status:** ❌ Não iniciado

---

### 🟡 P2 — IMPORTANTE

#### 2.1 Investigação Específica: Anpian
- **O quê:** Localizar e validar dados da empresa Anpian
- **Contexto:** Mencionada pelo utilizador, sem hit em pesquisa pública
- **Opções:**
  - Pesquisa Google direto por "Anpian" + variações ortográficas
  - Contacto via ANTRAM (associação de transportadores)
  - Busca em registos comerciais (NIRE/CRC)
- **Resultado esperado:** Confirmar existência, rotas, contacto
- **Responsável:** Yos
- **Status:** ❌ Não iniciado

#### 2.2 Raspar Movelia.es para Operadores Adicionais
- **O quê:** Script Python para extrair rotas internacionais PT e operadores associados
- **Plataforma:** movelia.es
- **Método:** BeautifulSoup + requests (sem API pública)
- **Filtros:** Origem Portugal, destino internacional
- **Output:** JSON com operadores, rotas, preços (opcional)
- **Tempo:** 2–4 horas
- **Responsável:** Claude Code (script) ou Yos (manual)
- **Status:** ⏳ Aguardando priorização

#### 2.3 Mapeamento Regional — Pesquisa Google Maps
- **O quê:** Pesquisar operadores por região fronteiriça
- **Regiões:**
  - Alto Minho (Monção, Valença, Ponte da Barca, Melgaço)
  - Beira Interior (Guarda, Sabugal, Penamacor)
  - Alentejo (Évoramonte, Marvão, Reguengos)
  - Douro (Pinhão, Torre de Moncorvo)
- **Queries:** `"autocarro internacional [cidade]"`, `"transporte passageiros [origem] [destino]"`
- **Resultado esperado:** Contactos adicionais de operadores regionais
- **Tempo:** 3–5 horas (manual)
- **Status:** ❌ Não iniciado

---

### 🟢 P3 — ESTRUTURA

#### 3.1 Estruturar Dados em Formato Consolidado
- **Formato:** CSV + JSON
- **Campos:**
  ```
  nome_operador | nipc | tipo (pequeno/médio/grande) | regioes_origem | 
  rotas_internacionais (JSON) | website | email | telefone | 
  ano_fundacao | frota_aprox | validado_imt | fonte
  ```
- **Resultado:** Ficheiro em `/docs/OPERADORES_TRANSPORTE_INTERNACIONAL.csv`
- **Responsável:** Yos (compilação) + Claude (validação)
- **Status:** ⏳ Aguardando dados de P1 + P2

#### 3.2 Modelo de Dados Supabase (VIAGENS)
- **Tabela:** `viagens_operadores`
- **Schema:**
  ```sql
  id (UUID, PK)
  nome (VARCHAR, NOT NULL)
  nipc (VARCHAR, UNIQUE)
  tipo (ENUM: pequeno/médio/grande)
  regioes_origem (TEXT[])
  rotas_internacionais (JSONB)
  website (VARCHAR)
  email (VARCHAR)
  telefone (VARCHAR)
  ano_fundacao (INT)
  frota_aprox (INT)
  ativa (BOOLEAN, default TRUE)
  validado_imt (BOOLEAN, default FALSE)
  fonte_dados (VARCHAR, enum: imt/movelia/antram/google/outra)
  notas (TEXT)
  created_at (TIMESTAMP)
  updated_at (TIMESTAMP)
  ```
- **RLS:** Pública (SELECT ativa=TRUE), admin (CRUD)
- **Responsável:** Claude (DDL) + Yos (execução)
- **Status:** ⏳ Aguardando aprovação schema

#### 3.3 Rotas Internacionais (Tabela Associada)
- **Tabela:** `viagens_rotas`
- **Schema:**
  ```sql
  id (UUID, PK)
  operador_id (FK → viagens_operadores)
  origem (VARCHAR) — cidade PT
  destino (VARCHAR) — cidade estrangeira
  pais_destino (VARCHAR)
  frequencia (ENUM: diário/semanal/2x-semana/mensal/ocasional)
  tempo_viagem (INT, horas)
  duracao_contrato (VARCHAR, e.g., "permanente", "2026-12-31")
  preco_aprox_euro (NUMERIC)
  paradas_intermedias (JSONB)
  ativa (BOOLEAN)
  fonte_dados (VARCHAR)
  ```
- **Responsável:** Claude (DDL) + Yos (dados)
- **Status:** ⏳ Aguardando dados de P1 + P2

---

### 🔵 P4 — FRONTEND (VIAGENS)

#### 4.1 Página de Listagem de Operadores
- **Rota:** `app/(viagens)/viagens/operadores/page.tsx`
- **Features:**
  - Lista de operadores com filtros: tipo (pequeno/médio/grande), região origem, validado_imt
  - Busca por nome
  - Ordenação: nome, tipo, ano_fundacao
  - Links para rotas (modal ou página detalhe)
  - Badge "Validado IMT" quando presente
- **Componentes:**
  - `operadores-list.tsx`
  - `operadores-filtros.tsx`
  - `operador-card.tsx`
  - `operador-detail-modal.tsx`
- **Responsável:** Claude (componentes) + Yos (integração)
- **Status:** ⏳ Aguardando tabelas Supabase

#### 4.2 Página de Detalhe de Operador
- **Rota:** `app/(viagens)/viagens/operadores/[operadorId]/page.tsx`
- **Conteúdo:**
  - Informações gerais (nome, tipo, NIPC, ano_fundacao, frota)
  - Contacto (website, email, telefone)
  - Rotas (tabela dinâmica: origem → destino, frequência, tempo, preço)
  - Mapa (Leaflet com origem + destinos principais)
  - Avaliações (integração com sistema de ratings)
  - Chat/contacto direto (integração com módulo mensagens)
- **Responsável:** Claude (layout) + Yos (dados)
- **Status:** ⏳ Aguardando fase anterior

#### 4.3 Breadcrumb de Navegação VIAGENS
- **Hierarquia:** `Home > Viagens > Operadores > [Operador] > Rotas`
- **Implementar em:** `app/(viagens)/layout.tsx`
- **Responsável:** Claude (componente) + Yos (integração)
- **Status:** ⏳ Aguardando estrutura de rotas

---

## Dependências

### Bloqueantes
- ✅ Identificação de fonte (IMT)
- ❌ Contacto com IMT (aguarda Yos)

### Complementares
- Módulo MENSAGENS (chat com operadores)
- Sistema de AVALIAÇÕES (ratings operadores)
- Mapa LEAFLET (integrado em detalhe operador)

---

## Cronograma Estimado

| Fase | Duração | Data Início | Data Fim | Status |
|------|---------|------------|---------|--------|
| P1 — Contacto IMT | 10 dias | 07-Set | 17-Set | ❌ Não iniciado |
| P2.1 — Anpian | 1 dia | 07-Set | 08-Set | ❌ Não iniciado |
| P2.2 — Movelia scraper | 4 horas | 17-Set | 17-Set | ⏳ Pós-P1 |
| P2.3 — Google Maps | 5 horas | 17-Set | 18-Set | ⏳ Pós-P1 |
| P3 — Estrutura dados | 3 horas | 18-Set | 18-Set | ⏳ Pós-P2 |
| P3 — Schema Supabase | 2 horas | 18-Set | 18-Set | ⏳ Pós-P2 |
| P4 — Frontend | 8 horas | 19-Set | 20-Set | ⏳ Pós-P3 |
| **Total** | **~33h** | **07-Set** | **20-Set** | — |

---

## Ficheiros de Referência

- `docs/pendentes/` → este ficheiro
- `docs/VIAGENS-OPERADORES-ESTUDO.md` (se existir)
- Session report: `SESSION-20260907-OPERADORES-TRANSPORTE-INTERNACIONAL.md`
- Transcrição: `/mnt/transcripts/2026-09-07-*.txt`

---

## Notas Adicionais

### Regulação
- Regulamento CE 1073/2009 — acesso ao mercado internacional de transporte em autocarro
- Autoridade: IMT (Instituto da Mobilidade e Transportes)
- Requisitos: Licença por operador, autorização bilaterais/multilaterais

### Mercado
- Altamente desregulado desde ~2010
- Muitos operadores pequenos operam apenas em nível regional
- Consolidação lenta (Rede Expressos é agregadora, não dona)

### Oportunidades Futuras
- Integração com API Movelia (comissão de reservas)
- Sistema de avaliações/reviews comunitário
- Newsletter de promoções por rota
- Calculadora de custo total (bilhete + transporte destino)

---

## Próximos Passos

1. **Yos:** Contactar IMT para lista oficial (email + telefone)
2. **Yos:** Investigar Anpian especificamente
3. **Yos:** Compilar dados de fontes públicas (Movelia, Google Maps)
4. **Claude:** Validar dados + estruturar
5. **Claude:** Criar schema Supabase + migration
6. **Claude/Yos:** Implementar frontend VIAGENS

---

**Última Atualização:** 07-Set-2026  
**Próxima Revisão:** 17-Set-2026 (após resposta IMT)
