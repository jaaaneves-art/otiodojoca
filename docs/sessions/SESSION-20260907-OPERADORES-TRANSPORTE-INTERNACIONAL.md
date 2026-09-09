# SESSION REPORT — Operadores de Transporte Internacional de Autocarros PT
**Data:** 07 de Setembro de 2026  
**Tema:** Levantamento de operadores pequenos/médios de transporte regular internacional  
**Contexto:** Módulo VIAGENS (emigrantes portugueses) — O Tio do Joca

---

## Objetivo da Sessão

Identificar quantas e quais empresas portuguesas operam serviços regulares de transporte de passageiros em autocarro para o estrangeiro, com foco em operadores pequenos/médios (não FlixBus).

---

## Descobertas Principais

### Operadores Confirmados (Levantamento)

| Operador | Região | Tipo | Rotas Conhecidas | Status |
|----------|--------|------|------------------|--------|
| **Rede Expressos** | Nacional | Agregadora (100+ empresas) | PT-ES, PT-FR, PT-IT | ✅ Oficial |
| **Barquense Viagens** | Alto Minho | Pequeno/médio | Internacional regional | ✅ Confirmado |
| **Auto Viação do Minho** | Alto Minho | Pequeno | PT-ES | ✅ Confirmado |
| **Rodoviária do Tejo** | Tejo | Médio | Linhas internacionais | ✅ Confirmado |
| **Transdev Portugal** | Nacional | Multinacional francesa | Múltiplas | ✅ Confirmado |
| **Barraqueiro Transportes** | Lisboa/Oeste | Médio/grande | Múltiplas | ✅ Confirmado |
| **Lazara** | Tui (ES) | Espanhol | PT-Andorra (40+ anos) | ✅ Confirmado |

### Operadores Mencionados (Não Localizados)
- **Anpian** — referenciado pelo utilizador, dados públicos não encontrados
- Presumivelmente muito pequeno ou operador regional com visibilidade limitada

### Estimativa Total
- **Rede Expressos:** ~100 empresas, mas nem todas internacionais
- **Operadores com linhas internacionais regulares:** ~15–40 (estimativa)
- **Operadores pequenos/médios independentes:** ~5–15

**Conclusão:** Não existe lista pública consolidada.

---

## Fontes Consultadas

### Pesquisas Realizadas
1. `web_search_fast`: "empresas transportes autocarro internacional Portugal"
2. `web_search_fast`: "Rede Expressos Rodaviariana TransDev Tejo"
3. `web_search_fast`: "IMT Instituto Mobilidade Transportes licenças"
4. `web_search_fast`: "operadores autocarros Portugal internacional regulares"

### Resultados

**Resultados Positivos:**
- Rede Nacional de Expressos (Wikipedia PT/ES)
- Lista de operadores nacionais (IMT) — encontrado ficheiro `LISTA_OPERADORES_TPColetivo_Nacional-DSRJE_v2.pdf`
- Movelia.es — agregador de rotas internacionais
- Transbus.org (FR) — lista de linhas internacionais Lisboa/Paris

**Resultados Negativos:**
- Sem hit direto para "Anpian"
- Dados de Brasil (ANTT) apareceram por coincidência
- Informação dispersa entre múltiplas fontes

---

## Como Recuperar Lista Completa

### Opção 1: IMT (Recomendado — Oficial)
```
Contacto: Instituto da Mobilidade e Transportes
Email: contacto@imt-ip.pt
Telefone: +351 21 […]
Pedido: "Lista de operadores com autorização para serviços regulares internacionais"
Tempo esperado: 5–10 dias úteis
```

### Opção 2: Agregadores Públicos
- **Movelia.es** — scrapar rotas PT-ES/EU (Python + BeautifulSoup)
- **Rome2rio / Busbud** — têm APIs de operadores
- **Google Maps** — pesquisa por cidade `autocarro internacional [origem]/[destino]`

### Opção 3: Associações Profissionais
- **ANTRAM** — Associação Nacional de Transportadores Rodoviários
- **Confederação do Turismo** — contactos de operadores

### Opção 4: Search Manual por Região Fronteiriça
- Alto Minho (PT-ES): Monção, Valença, Ponte da Barca
- Beira Interior (PT-ES): Guarda, Sabugal
- Alentejo (PT-ES): Évoramonte, Marvão

---

## Aplicação ao Projeto OTJ

### Módulo VIAGENS (Emigração)
**Objetivo:** Listar operadores de autocarros para rotas Portugal ↔ Diáspora Europeia

**Fluxo Sugerido:**
1. **Fase 1:** Contactar IMT → obter lista oficial
2. **Fase 2:** Validar contra Movelia + Google Maps
3. **Fase 3:** Estruturar em Supabase (`transporte_internacional_operadores`)
4. **Fase 4:** Frontend com filtros: origem, destino, frequência, preço

**Schema Base:**
```sql
CREATE TABLE viagens_operadores (
  id UUID PRIMARY KEY,
  nome VARCHAR NOT NULL,
  tipo ENUM ('pequeno', 'médio', 'grande'),
  regioes_origem TEXT[],
  rotas_internacionais JSONB,
  website VARCHAR,
  telefone VARCHAR,
  email VARCHAR,
  ativa BOOLEAN DEFAULT true,
  validado_imt BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Pendências

- [ ] Contactar IMT para lista oficial
- [ ] Validar Anpian (investigação específica)
- [ ] Raspar Movelia para operadores adicionais
- [ ] Estruturar dados em CSV/JSON
- [ ] Implementar modelo Supabase
- [ ] Integrar com módulo VIAGENS

---

## Notas

- **Regulação:** EU Regulamento 1073/2009 (acesso ao mercado internacional)
- **Autoridades:** IMT (Portugal), similar em cada país EU
- **Mercado:** Altamente competitivo desde liberalização (últimos 15 anos)
- **Visibility:** Operadores pequenos muitas vezes apenas em plataformas regionais

---

## Conclusão

Encontrada informação sobre operadores principais e agregadores. A lista completa de operadores pequenos/médios **não é recuperável via pesquisa direta**, mas é oficialmente registada no IMT. Recomendação: contacto direto com IMT para dados fiáveis e atualizados.

Anpian especificamente requer investigação adicional — pode ser operador regional com visibilidade mínima online.
