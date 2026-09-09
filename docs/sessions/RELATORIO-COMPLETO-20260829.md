# Relatório completo do dia — 29 de agosto de 2026

Consolidação de tudo o que foi feito hoje na plataforma OTJ, arrancando a implementação do módulo social a partir do prompt mestre (79 secções, metodologia de fases FASE 0–12). Cada tópico tem o seu documento próprio, mais detalhado, referenciado em cada secção. Ordem cronológica.

---

## 1. Estudo Flutter vs PWA — 21:0x

**Detalhe:** `claude/ESTUDO-FLUTTER-VS-PWA-MODULO-SOCIAL-20260829.md`.

Primeiro pedido do dia: estudo sobre se Flutter é boa ideia para o módulo social do OTJ. Conclusão: **não adotar Flutter agora** — PWA/Next.js continua o caminho certo para o MVP do módulo social, pelas razões de reutilização de código e maturidade do SDK Web do LiveKit, não por custo.

- Inclui comparação PWA vs Flutter, limitações do PWA em iOS Safari (sem VoIP push/CallKit, sem execução em background real, restrições de push desde iOS 17.4), maturidade dos SDKs LiveKit por plataforma, um ADR e uma secção adicionada depois (pedido do Yos) sobre quando/como sair da PWA no futuro: só depois do módulo social estar estável, com uma única framework cross-platform (não duas nativas separadas), backend inalterado, iOS a considerar primeiro, framework a escolher com dados reais.

## 2. FASE 0 — Auditoria do módulo social — 21:1x

**Detalhe:** `claude/AUDITORIA-FASE0-MODULO-SOCIAL-20260829.md`.

Auditoria read-only do código e schema reais (via ligação ao computador do Yos), seguindo a metodologia do prompt mestre ("ler antes de alterar, nunca destrutivo"). Tabela de entidades existentes/reutilizáveis, tabela de gaps, tabela de riscos, 3 ADRs curtos (Storage, LiveKit, Notificações com app fechada).

- **Correção a um relatório anterior:** `AUDITORIA-REDE-SOCIAL-MFA-20260824.md` (24/08) tinha dado `middleware.ts` como em falta — na realidade o Next.js 16 renomeou o ficheiro para `proxy.ts`, que está corretamente montado. Documento antigo não foi apagado, só sinalizado como desatualizado nesse ponto.
- Risco de MFA por confirmar → **confirmado pelo Yos durante o dia:** "funciona, testado hoje".
- Descoberto e reutilizado o padrão já em produção para deduplicação de conversas 1:1 (`marketplace_conversations`, índice único `least/greatest`), base de toda a Fase 1/2.
- Resultado: EVOLUI.

## 3. FASE 1 — Arquitetura final do módulo social — 21:1x, atualizada 22:45/23:05

**Detalhe:** `claude/FASE1-ARQUITETURA-MODULO-SOCIAL-20260829.md`.

Define entidades, storage, realtime, chamadas, APIs e uma primeira estimativa de custos.

- **Decisão de arquitetura:** tabelas novas e genéricas para o módulo social (`conversations`, `conversation_participants`, `messages`, `message_media`, `groups`, `group_members`, `call_rooms`, `call_participants`) em vez de generalizar `marketplace_conversations` — para não arriscar as 5 áreas de produção que já a usam (Gran Bazar, Imóveis, Lup, Viaturas, StandGo).
- LiveKit Cloud (não self-hosted) para o MVP; upgrade para o plano Ship quando o beta passar de ~100 utilizadores ativos em chamadas.
- **Risco herdado resolvido durante o dia:** o "EXCEEDING USAGE LIMITS" do Supabase, mencionado desde 28/08 sem investigar — ver secção 6.
- Resultado: EVOLUI.

## 4. Estudo — Beta a custo zero (3 meses, 50–400 utilizadores) — 22:20

**Detalhe:** `claude/ESTUDO-CUSTO-ZERO-BETA-3-MESES-20260829.md`.

Pedido em paralelo pelo Yos: análise técnica sénior sobre viabilidade de correr o beta a custo zero com Flutter+Supabase+R2+LiveKit+FCM+Cloudflare (a stack e os números foram os do Yos, confirmados e completados com fontes oficiais de 29/08/2026).

- **Achado importante, não previsto pelo Yos:** o LiveKit Cloud Build (grátis) tem um segundo teto independente de **50 GB/mês de banda descendente**, além dos 5.000 minutos-participante — mais restritivo do que a nota original sugeria, e é o que rebenta primeiro em qualquer cenário com chamadas de vídeo a partir de ~200 utilizadores.
- **Veredicto:** sim para 50–100 utilizadores com disciplina de retenção; não totalmente grátis para 200–400, mas os custos de overflow são pequenos e previsíveis (R2: cêntimos/GB; LiveKit: upgrade fixo de $50/mês) — o fator decisivo é a política de retenção de media, não a stack.

## 5. FASE 2 — Database do módulo social — 22:28, concluída 23:58

**Detalhe:** `claude/FASE2-DATABASE-MODULO-SOCIAL-20260829.md`.

Objetivo: criar as tabelas/migrations da Fase 1. Foi de longe a parte mais trabalhosa do dia — três incidentes reais de infraestrutura apanhados e resolvidos pelo caminho, nenhum deles chegou a afetar a produção sem ser detetado primeiro.

**Resultado final:** `npx supabase db push` aplicado com sucesso às 23:58 — 8 tabelas novas, 5 funções, 3 triggers, RLS completo, e o `notifications.type` alargado (`message`, `call`, `group_invite`) já em produção. Verificado localmente com `supabase db reset` antes do push. Commit `172ba2f` feito.

### Incidentes encontrados e resolvidos

1. **"EXCEEDING USAGE LIMITS" no Supabase (herdado desde 28/08)** — a base de dados estava a 129% do limite do plano Free (0,645 GB de 0,5 GB). Causa: a tabela `netuno_log` (295 MB) de uma framework legada ("Netuno") sem qualquer referência confirmada no código Next.js (`grep` ao repositório inteiro deu zero resultados). Resolvido com `TRUNCATE TABLE public.netuno_log` — base de dados real confirmada em **306 MB** via `pg_database_size()` (não só o Dashboard, que demora a atualizar). O Yos recorda que o Netuno estava ligado às tabelas de códigos postais — por confirmar amanhã (secção "Pendentes").

2. **Histórico de migrations incompleto** — as ~90 tabelas originais do projeto nunca tiveram migration própria (criadas antes de o projeto adotar migrations, provavelmente à mão/Studio). Isto impedia qualquer comando que reconstrua a base de dados do zero (`db diff`, `db pull`), com erros do tipo "relation does not exist". Resolvido, sem tocar em dados de produção: as 25 migrations antigas foram arquivadas (`supabase/migrations_archive/`, não apagadas), `migration repair --status reverted` corrigiu só o registo remoto, e `supabase db pull` gerou uma baseline única e correta (`20260829220537_remote_schema.sql`) a partir do schema real da produção.

3. **`db diff` propôs apagar toda a base de dados** — ao tentar gerar a migration da Fase 2 com `supabase db diff -f social_module_v1`, o resultado incluía `DROP TABLE` para praticamente todas as ~90 tabelas de produção, incluindo `profiles` e `marketplace_conversations`. **Nada disto chegou a ser aplicado** — identificada a causa antes de qualquer `db push`: `supabase/config.toml` tem `schema_paths = []` (o fluxo declarativo nunca esteve realmente ligado; as migrations sempre foram escritas à mão). O ficheiro destrutivo gerado ficou visível no disco (`20260829221352_social_module_v1.sql`) e foi movido para arquivo antes de qualquer risco. A migration final da Fase 2 foi **escrita à mão**, reordenando manualmente tabelas → funções → policies/triggers para resolver uma dependência circular real (`groups` ↔ `group_members` ↔ `is_group_member`), e testada localmente (`db reset`, zero erros) antes do `db push`.

4. **Colisão de nome de índice** — `idx_messages_conversation` já existia em produção (índice de `marketplace_messages`); a nova tabela `messages` foi ajustada para `idx_social_messages_conversation`.

---

## Pendentes do dia — o que falta tratar amanhã

### Prioridade 1 — Netuno e códigos postais

**Detalhe:** `docs/pendentes/NETUNO-CODIGOS-POSTAIS-20260829.md`.

O Yos recorda que o Netuno está ligado às tabelas de códigos postais/artérias — e que é essa parte que deve ser apagada. Por confirmar: a ligação exata, e se as tabelas `arteria`/`codigo_postal`/`codigo_postal_arteria` (que apareceram duplicadas, com tamanhos diferentes, durante o diagnóstico de hoje) são schemas diferentes ou dados duplicados. Decidir depois se as 16 tabelas `netuno_*` restantes ficam ou são removidas.

### Prioridade 2 — StandGo: reforçar com o AutoNex + novo nome

**Detalhe:** `docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md`.

O Yos enviou o **AutoNex** (demo completa de marketplace de automóveis — autocomplete de marca/modelo, filtros avançados, mapa Leaflet) para reforçar a UX do StandGo. **O Yos não gosta do nome "StandGo"** e quer trocar — pediu para eu também propor uma alternativa amanhã.

### Prioridade 3 — JobNex: analisar e decidir destino

**Detalhe:** `docs/pendentes/JOBNEX-ANALISE-20260830.md`.

Segunda demo enviada (marketplace de emprego, mais pequena, sem PROMPT.md). Ao contrário do AutoNex, ainda não tem destino definido no OTJ — perguntar ao Yos se é para um módulo novo (bolsa de emprego local) ou só inspiração. Nota: dados mock usam nomes de empresas portuguesas reais (Farfetch, OutSystems, etc.) — trocar por fictícios antes de qualquer publicação.

### Prioridade 4 — Não urgente

- **`docs/pendentes/DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md`** — configurar corretamente `schema_paths` no `config.toml` para o `db diff` voltar a ser utilizável (hoje, migrations continuam a escrever-se à mão, o que já é seguro).
- **Política de retenção de media** (secção 17 do prompt mestre, referenciada em `message_media.expires_at`) — ainda por decidir; é o fator que mais influencia se o beta consegue mesmo correr perto de custo zero (ver secção 4 deste relatório).
- **Confirmar CAE-uso do StandGo "Ceder"** e outros itens menores já registados em dias anteriores continuam em aberto (ver `RELATORIO-COMPLETO-20260828.md`).

### Continuação da metodologia do prompt mestre

Depois de resolvidos os pendentes acima (ou em paralelo, se o Yos preferir), o próximo passo natural no roteiro de 13 fases é a **FASE 3 — testes de RLS** das tabelas novas do módulo social, seguida da FASE 4 (implementação de mensagens no código) e FASE 5 (confirmação dos buckets de Storage).
