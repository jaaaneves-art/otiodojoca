# AUDITORIA DO CALENDÁRIO — PONTO DE SITUAÇÃO E CONTINUAÇÃO
## Projeto O Tio do Joca (OTJ)

**Data:** 15 de Agosto de 2026
**Sessão:** Calendário Lunar — Camada 1
**Objetivo deste documento:** registar o que foi feito hoje, o que os docs
preveem, e o que falta — para retomar amanhã sem perder o fio.

---

## 1. O QUE FOI CONSTRUÍDO HOJE ✅

A **Camada 1 (Calendário Lunar público)** ficou funcional:

| Peça | Ficheiro | Estado |
|------|----------|--------|
| Motor da lua (perpétuo) | `lib/calendario/lua.ts` | ✅ Validado 7/7 datas reais |
| Dados da tradição | `lib/calendario/tradicao.ts` | ✅ Dos docs |
| Lua realista (foto+fase) | `components/calendario/lua-foto.tsx` | ✅ Validado em Chromium |
| Foto placeholder | `public/lua.jpg` | ✅ (trocar por NASA depois) |
| Página do calendário | `app/calendario/page.tsx` | ✅ Com acordeão nos dias |

**Funcionalidades entregues:**
- Fase da lua de hoje, com % de iluminação e símbolo realista
- O que fazer / evitar hoje (sabedoria tradicional)
- Seletor de região (Norte / Centro / Sul) com ajustes
- Próximos 14 dias, cada um com a sua mini-lua e %
- Clicar num dia abre um painel por baixo com a info desse dia (acordeão)
- O que semear por tipo de planta e fase
- Nota científica honesta (tradição, não regra provada)
- Cálculo perpétuo (funciona 1950–2200, qualquer data)

**Decisões tomadas:**
- Fases da lua: calculadas em código (perpétuo) ✅
- Login: já funciona ✅
- Agenda agrícola: será integrada com o módulo Agricultura ✅
- Nome público: "Calendário Lunar" (nunca "Borda d'Água" — direitos de autor)

---

## 2. O QUE FALTA — POR CAMADAS

### CAMADA 1 — Calendário Lunar (quase completa)

Pequenos remates que faltam:
- [ ] **Ativar o card na homepage** (continua "Brevemente" — falta ligar a `/calendario`)
- [ ] **Commit + push** do trabalho de hoje
- [ ] (Opcional) Trocar a foto placeholder pela foto real da NASA (domínio público)
- [ ] (Opcional) Poder recuar dias, não só avançar (ex: ver ontem)

### CAMADA 2 — Agenda Agrícola (o coração — ainda por fazer)

Esta é a peça principal que o utilizador pediu: "plantei pepinos" → o
sistema acompanha o ciclo e avisa o que fazer, cruzando com a lua.

Decidido: **integrar com o módulo Agricultura**. Mas há um problema a
resolver primeiro:

⚠️ **O módulo Agricultura NÃO existe em base de dados.** Os docs
descrevem-no (MODULO-24-GESTAO-DA-EXPLORACAO, MODULO-14-CULTURAS), mas
não há tabelas criadas em Supabase. Antes da agenda, é preciso criar a
base.

Falta:
- [ ] **Tabelas em Supabase:** explorações → parcelas → culturas → tarefas
- [ ] **Catálogo de culturas** (`culturas_guia`) com o **ciclo em dias**
      (ex: pepino germina ~7d, colhe ~50d). Os docs têm as épocas por mês
      (`10.md`, MODULO-14) mas **não as durações em dias** — esta é a
      grande lacuna de conteúdo a preencher, cultura a cultura.
- [ ] **Geração automática de tarefas** ao registar um cultivo
- [ ] **Cruzamento com a lua** (usar já o motor `lua.ts` — pronto)
- [ ] **Vista "o que fazer hoje / esta semana"** (a agenda-lembrete)
- [ ] **Alertas / notificações** (os docs preveem — MODULO-11 "Evolução")

### CAMADA 3 — Agenda Pessoal (secundária — por fazer)

Eventos livres do utilizador (consultas, jantares, exames).
- [ ] Tabela `eventos_pessoais`
- [ ] CRUD simples + lembretes
- [ ] Vista de calendário mensal

### CAMADA 4 — Almanaque editorial (grande, futuro)

O "livro" completo que os docs descrevem (OTJ-FUNC-005).
- [ ] Calendário diário com santos e efemérides
- [ ] Provérbio do dia
- [ ] Meteorologia popular
- [ ] Receitas tradicionais
- [ ] Dias comemorativos (⚠️ usar versão corrigida — erro do ano bissexto)

---

## 3. O QUE OS DOCS PREVEEM (referência)

**MODULO-11 (Calendário Agrícola) — funcionalidades previstas:**
Calendário mensal · Tarefas por cultura · Sementeiras · Plantações ·
Transplantes · Podas · Colheitas · Tratamentos · Fertilizações · Rega.
Filtros: Região · Cultura · Mês · Tipo de atividade.
Evolução: Alertas automáticos · Calendário personalizado · Meteorologia ·
IA · Sincronização com calendário pessoal.

→ **Já temos:** região, recomendações por fase, base lunar.
→ **Falta:** tarefas por cultura, filtros por cultura/mês/atividade, alertas.

**MODULO-14 (Culturas) — informação por cultura:**
Nome comum/científico · Descrição · Época sementeira · Época plantação ·
Rega · Fertilização · Pragas · Colheita · Conservação.

→ Esta é a estrutura para o `culturas_guia`. Falta acrescentar
**duração em dias** de cada etapa (não está nos docs).

**OTJ-FUNC-005 (Almanaque) — o núcleo editorial:**
Calendário diário/mensal · Efemérides · Santos · Fases da Lua ·
Agricultura · Agenda de sementeiras · Provérbios · Receitas.

→ É a Camada 4. Muito conteúdo já escrito nos Volumes I-XII.

---

## 4. PLANO PARA AMANHÃ (sugestão)

**Passo 1 — Fechar a Camada 1 (15 min)**
Ativar o card na homepage + commit. Deixar o calendário lunar "no ar".

**Passo 2 — Começar a Camada 2 (a decisão importante)**
Antes de código, decidir o âmbito da base agrícola:
- Opção simples: uma só tabela `cultivos` (o utilizador diz o que plantou
  e quando) + `culturas_guia`. Rápido, dá logo a agenda.
- Opção completa: explorações → parcelas → culturas → tarefas (como os
  docs). Mais poderoso, mais trabalho.

**Passo 3 — Catálogo de culturas**
Criar `culturas_guia` e semear 5-8 culturas comuns com ciclo em dias.
Começar pelo pepino e tomate (exemplos que o utilizador deu).

---

## 5. DECISÕES PENDENTES PARA AMANHÃ

1. **Âmbito da agenda agrícola:** versão simples (1 tabela) ou completa
   (explorações/parcelas)? A simples dá resultado visível mais depressa.
2. **Ciclo das culturas em dias:** de onde vêm os dados? (pesquisar fontes
   fiáveis, ou o utilizador fornece a partir da experiência?)
3. **Notificações:** por email? no site? deixar para depois?

---

## 6. NOTAS IMPORTANTES A RETER

- ⚠️ **"Borda d'Água" nunca em público** — direitos de autor. Conteúdo
  factual pode usar-se; o nome não.
- ⚠️ **Erro do ano bissexto** nos ficheiros de dias comemorativos — não
  usar sem a versão corrigida (173 entradas).
- ⚠️ **Módulo Agricultura só existe em papel** — criar BD antes da agenda.
- ✅ **Método que funciona:** criar ficheiro → validar no sandbox →
  descarregar → `cp` no sítio → `npm run build`. Evitar colar código
  grande diretamente no terminal (corrompe com bracketed paste).
- ✅ **Motor da lua está pronto e é perpétuo** — reutilizar na Camada 2.

---

## 7. COMO RETOMAR

```bash
cd ~/projetos/otiodojoca
git pull
npm run dev
# abrir http://localhost:3000/calendario
```

---

**Estado do Calendário:** Camada 1 funcional. Faltam remates + Camadas 2-4.
**Próximo foco:** fechar Camada 1 e arrancar a Agenda Agrícola.
