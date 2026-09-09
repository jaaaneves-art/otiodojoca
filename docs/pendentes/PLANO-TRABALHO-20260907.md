# Plano de trabalho — a partir de 07/09/2026

**Preparado em:** 07/09/2026
**Base:** todos os ficheiros em `docs/sessions/` e `docs/pendentes/`
**Fora deste plano, por pedido explícito:** Espetáculos (Fase 0 por validar, Fase 3 com questões de autorização em aberto — ver `docs/pendentes/ESPETACULOS-FASE3-QUESTOES-AUTORIZACAO.txt`)
**Ver também:** `docs/pendentes/PLANO-PRIORIDADES-20260907.md` — os mesmos itens, ordenados por importância em vez de por sequência de execução

---

## 1. Panorama

Há cinco frentes vivas, mais um conjunto de pendentes mais antigos e de baixa prioridade. A frente mais urgente é a camada de **adesões**, decidida esta manhã (07/09): substitui o modelo de "pessoas por módulo" em Educação, Universidades e Escutismo por uma tabela genérica (`grupos` + `adesoes`) ligada a `profiles`. Isto **bloqueia** a continuação de dois módulos ao mesmo tempo, por isso vem primeiro.

| Frente | Estado real | Bloqueia |
|---|---|---|
| Camada de Adesões | SQL escrito, **por executar**, com 5 verificações obrigatórias antes | Educação, continuação do Escutismo |
| SendGrid (envio de email) | Biblioteca instalada, chave existe, **zero linhas de código a enviar** | Escutismo Fase 4, integração de registo/login do Sprint 10 |
| Segurança / Sprint 10 | SQL já aplicado em produção; TypeScript por copiar | Login por username, auditoria completa |
| Escutismo | Fase 1 (schema) aplicada e testada; Fase 2 (server actions) por começar | Fases 3–7 |
| Educação/Universidades (pacote 05/09) | Só passou no parser, nunca correu; parte dele **já está superada** pela camada de Adesões | Frontend dos dois módulos |

---

## 2. Ordem proposta

### Bloco 1 — SendGrid: teste ponta a ponta (30 min)

Desbloqueia mais coisas por minuto de esforço do que qualquer outro item. Sem isto, nem o Sprint 10 fica testável em condições nem o Escutismo chega à Fase 4.

- Correr o script de teste já preparado em `docs/pendentes/PROXIMA-SESSAO-20260907.md` (secção P1)
- Erro mais provável: `403 Sender Identity não verificada` — resolve-se em SendGrid → Sender Authentication ou domain authentication no Cloudflare
- Depois: acrescentar `SENDGRID_FROM_EMAIL` ao `.env.local` e ao Vercel; copiar `send-secure.ts`

### Bloco 2 — Segurança / Sprint 10: fechar o que falta (1 h + itens soltos)

O SQL já está em produção (confirmado no dia 06/09). Falta só o código:

- Copiar os quatro ficheiros TypeScript (`lib/email`, `lib/auth`, `lib/audit`, `lib/db`) e `npm run build`
- **Não integrar ainda os formulários** de registo/login — isso é Sprint 11 e depende do Bloco 1
- Itens de robustez ainda em aberto, sem pressa: policy de INSERT anónimo em `profiles` a remover se o registo funcionar sem ela; `GRANT EXECUTE` desnecessário em `handle_new_user()`; `role`/`status` legíveis por qualquer visitante (falta view pública); trigger que impeça um utilizador de alterar o próprio `role`; RLS de `marketplace_ads` tratada à parte, com o marketplace testado logo a seguir; limpar registos de teste em `profiles`

Nota: o `PENDENTES-SEGURANCA-SPRINT10.md` de 05/09 (o que veio das Transferências hoje) está parcialmente ultrapassado — foi escrito antes de se confirmar que a tabela real se chama `profiles`, não `user_profiles`. Seguir antes o `PROXIMA-SESSAO-20260907.md`, que já reflete o estado real.

### Bloco 3 — Camada de Adesões: verificar e executar (30 min – 1 h)

**A prioridade do dia.** Cinco verificações contra a base real antes de correr `OTJ-SQL-ADESOES-V001.sql` — cada uma falha em silêncio se ignorada:

1. `profiles.id = auth.users.id`? (se não, todas as policies ficam inúteis sem erro visível)
2. Existe `profiles.data_nascimento`? (se não, todos passam a "menor" por omissão)
3. `pgcrypto` instalado?
4. Já existe tabela de tutores do Escutismo? (não criar `tutorias` a dobrar — migrar a existente)
5. Sobreposição com `entidade_pedidos` — decidir se coexistem ou se uma absorve a outra

Executar por `psql` (nunca pelo SQL Editor — fica à espera de confirmação em silêncio com DDL que cria tabelas). Depois testar os cinco passos do fluxo (pedir → aprovar moderador → aprovar tutor se menor), com atenção especial ao passo 4: um menor **não pode** ficar aprovado só com o moderador.

### Bloco 4 — Educação sobre Adesões (várias horas, sem estimativa fechada)

Só depois do Bloco 3. Por decidir antes de escrever SQL: perfis estendidos (professor/estudante) ficam em tabela própria ou em `adesoes.dados_adicionais` (jsonb) — provavelmente os dois, a dividir por "o que é da pessoa" vs. "o que é da adesão". Depois: confirmar `papeis_permitidos` por tipo de grupo com o Yos, reescrever `OTJ-SQL-EDUCACAO-V001.sql` sobre `grupos`, `types.ts`, `actions.ts`. Frontend não começado.

### Bloco 5 — Escutismo Fase 2+ (server actions em diante)

Também depende do Bloco 3, porque a tutoria do Escutismo passa a apoiar-se na tabela genérica `tutorias`. A partir daí: Fase 2 server actions (5–6 h), Fase 3 componentes (7–9 h), Fase 4 páginas e emails — **bloqueada pelo Bloco 1** —, Fase 5 fotografias (a mais pesada, 6–8 h, pode ficar para uma segunda iteração), Fase 6 testes, Fase 7 integração.

### Bloco 6 — Universidades: o mesmo tratamento que a Educação já teve

Ainda não existe um `UNIVERSIDADES-REESCREVER-SOBRE-ADESOES.md`. O pacote de 05/09 (`EDUCACAO-UNIVERSIDADES-20260905.md`) tem a mesma falha estrutural que o de Educação tinha: a parte de "pessoas" (`pessoas_universitarias`) fica substituída por `profiles` + `adesoes`. Antes de validar SQL de Universidades (Fase 1 do documento de 05/09), vale a pena escrever essa reconciliação — evita repetir o mesmo SQL duas vezes.

### Bloco 7 — Empregos: resolver o deploy (1–2 h, independente)

MVP funcionalmente completo; falta o operacional:
- Investigar o 500 do endpoint `/api/cron/job-alerts` pelos *Runtime Logs* do projeto Vercel **"jj"** (não "otiodojoca"). Primeira suspeita: variável de ambiente do `createAdminClient()` em falta nesse projeto.
- Apagar o projeto Vercel duplicado "otiodojoca" (decisão já tomada, sem risco)
- Teste completo em browser depois do 500 resolvido

### Bloco 8 — Botão de editar nos módulos restantes (1–2 h, independente)

Feito em `mercado-da-terra`; faltam `gran-bazar`, `imoveis`, `lup`, `viaturas`. O padrão já existe — replicar, com atenção a `app/imoveis/meus-anuncios/page.tsx` que diverge ligeiramente dos outros três.

### Bloco 9 — StandGo/AutoNex: à espera do Yos (sem código novo)

2 de 3 peças escritas (autocomplete+chips, mapa) — nada testado no browser ainda. Antes de continuar: o Yos testar `npm run dev`, e decidir o nome novo (short-list em `STANDGO-REFORCO-AUTONEX-RENOME-20260829.md`: Garagem, Rodalivre, AutoVizinho, MeuStand, Kilómetro Zero).

---

## 3. Decisão transversal a abrir já, sem fechar hoje

**RGPD de dados de menores** — Educação, Escutismo e Universidades vão tratar dados de crianças identificadas, incluindo dados de saúde em `observacoes_especiais` (categoria especial, art. 9.º). O Escutismo tem política desenhada; os outros dois não herdaram nada. Falta: base legal por finalidade, AIPD (provavelmente obrigatória), prazos de conservação, contrato de subcontratação com a Supabase, registo de acessos a campos sensíveis. **Regra em vigor entretanto: nenhum dado real de criança na base, só dados sintéticos.**

---

## 4. Fica de fora por agora, sem trabalho alocado

- **Espetáculos** — excluído deste plano, conforme pedido
- **OAuth social login (Google/Facebook)** — código pronto e testado; parado por decisão consciente até haver domínio definitivo. Nada a fazer até lá.
- **`supabase db diff` não configurado** — baixa prioridade, não bloqueia nada, resolver com calma
- **Reorganização de `docs/`** — sessions e pendentes já foram tratados hoje (fora deste documento); falta só aplicar `docs/decisoes/`, `docs/estudos/`, `docs/guias/` do mesmo pacote (`INSTALAR.sh`), quando houver 10 minutos
- **PHASE7 Alojamento** (reservas com 404, checklist E2E) — de 21/08, sem menção nos relatórios mais recentes. Antes de alocar tempo, vale confirmar se ainda é reprodutível ou se ficou resolvido por alterações posteriores
- **Módulo Freguesia**, Fases E e F — aberto desde 19/08, sem ficheiro revisto nesta ronda
- **28 ficheiros SQL soltos em `~/Transferências`**, com nomes genéricos (`code(1).sql`, etc.) — risco real de correr o script errado contra produção; vale uma arrumação rápida
- **Branch `origin/docs-audit`** — 9 commits, 162 ficheiros, ~19.700 linhas divergentes. Não apagar sem auditoria própria.

---

## 5. Regras que se mantêm válidas

1. Nada vai à base de produção sem ter corrido em local primeiro.
2. Nenhum DDL pelo SQL Editor do Supabase — usar `psql`, que falha alto em vez de ficar à espera em silêncio.
3. Nunca `supabase db diff` neste projeto — migrations escritas à mão.
4. Uma tabela viva de cada vez ao ligar RLS, com o `DISABLE` já escrito antes do `ENABLE`.
5. Nenhum dado real de menor na base até a decisão de RGPD fechar.
