# Relatório completo do dia — 30 de agosto de 2026

Consolidação de tudo o que foi feito hoje no módulo **Empregos (JobNex)** — desde a conclusão da Fase 6 até à Fase 9, e depois toda a saga do primeiro deploy a sério em produção na Vercel. Ordem cronológica. Detalhe técnico completo de cada fase em `docs/EMPREGOS.md` (secções 12–15); este relatório foca-se no que aconteceu e nas decisões tomadas.

---

## 1. Conclusão da Fase 6 — Candidaturas — 19:53

Sessão anterior tinha ficado a meio por desconexão da ponte com o computador do Yos. Retomada e concluída: fluxo completo candidato↔empresa sobre `applications`/`application_events` (submeter candidatura, ver estado, retirar candidatura, empresa gerir candidatos por vaga e mudar estado, com notificação em cada mudança relevante). Sem alterações à base de dados. Detalhe em `docs/EMPREGOS.md` secção 12.

Nota do Yos reforçada e documentada explicitamente nesta altura: só uma empresa registada **e aprovada** pode publicar vagas — já estava garantido em duas camadas (aplicação + estrutura da base de dados), mas o Yos pediu para ficar dito por escrito na documentação (secção 10).

## 2. Fase 7 — Matching — 20:29

**Detalhe:** `docs/EMPREGOS.md` secção 13.

Motor de matching por regras (`lib/empregos/matching.ts`), sem I/O, 4 componentes com peso fixo: competências 40%, localização 20% (Haversine real entre municípios), experiência 25%, formação 15%. Componentes não aplicáveis (perfil incompleto) saem da média em vez de a distorcer. Testado com 8 testes automatizados (`matching.test.ts`, vitest — primeiro ficheiro de teste do módulo). Ligado a três superfícies: vaga individual (`/empregos/[id]`, cartão de compatibilidade com barra por componente), listagem pública (`/empregos`, badge por vaga + ordenar por compatibilidade) e painel de candidaturas da empresa (badge por candidato, respeitando a privacidade de `perfil_publico`).

## 3. Fase 8 — Admin: moderação de vagas e denúncias — 20:44

**Detalhe:** `docs/EMPREGOS.md` secção 14.

Fecha o roadmap do MVP (secção 6 do documento). Migration nova (`20260830203000_empregos_module_fase8.sql`): tabela `job_reports` + a primeira política de admin alguma vez criada em `jobs` (até agora nenhum admin conseguia gerir vagas diretamente). `/empregos/[id]` ganhou um `<details>` "Denunciar esta vaga"; `/admin/empregos` (novo) mostra denúncias pendentes e todas as vagas com ações diretas (rejeitar/reativar).

## 4. Fase 9 — Alertas de emprego — 21:01

**Detalhe:** `docs/EMPREGOS.md` secção 15.

Primeira funcionalidade pós-MVP, escolhida pelo Yos entre três propostas (alertas / dados salariais / avaliações de empresa). Candidato guarda uma pesquisa e recebe notificação quando surge vaga nova compatível. Migration nova (`job_alerts`, `job_alert_matches`, com `unique(alert_id, job_id)` para nunca notificar duas vezes a mesma vaga). Endpoint novo `app/api/cron/job-alerts/route.ts`, protegido por `CRON_SECRET`, pensado para Vercel Cron (`vercel.json` novo, diário às 7h UTC) — a primeira peça do módulo a correr fora de um pedido de utilizador, por isso é a primeira a precisar de configuração fora do código.

## 5. Primeira aplicação a sério das migrations pendentes — 21:19–21:36

O Yos correu tudo pelo terminal, com instruções passo a passo:

- **`supabase` CLI não estava instalado** — resolvido com `npx supabase db reset` (sem instalação permanente).
- **Incidente evitado:** a tentativa de instalar o CLI a sério (`tar -xz` + `mv` para `/usr/local/bin`) colidiu com a pasta `supabase/` do próprio projeto (mesmo nome), que ficou temporariamente movida para `/usr/local/bin/supabase`. Detetado antes de qualquer dano permanente, confirmado com `ls` e corrigido com `mv` de volta — nada se perdeu, as 5 migrations continuavam intactas dentro da pasta.
- `npx supabase db reset` (local) e depois `npx supabase db push` (produção) aplicaram com sucesso as migrations da Fase 8 e Fase 9.
- **Primeiro commit real de várias fases** — o `git add . && git commit && git push` feito nesta altura foi o primeiro a apanhar não só a Fase 8/9 mas também ficheiros de fases anteriores (perfil de candidato, empresas, candidaturas, etc.) que nunca tinham sido commitados — o Nextcloud tinha estado a sincronizar os ficheiros no disco sem disciplina de git ao longo do dia, mesmo padrão já visto noutros módulos.

## 6. Primeiro build a sério na Vercel — descoberta de dois problemas reais — 21:26–21:36

Este foi o primeiro `npm run build` que este projeto alguma vez tentou correr na Vercel (confirmado: a lista de deployments históricos mostrava erro desde o "Initial commit"). Dois problemas genuínos descobertos, nenhum deles causado pelo trabalho de hoje:

**a) Três ficheiros com um pressuposto de tipo errado sobre `skills(nome)`** — `app/empregos/[id]/page.tsx`, `app/empregos/empresa/vagas/[id]/editar/page.tsx`, `app/perfil/candidato/page.tsx` (das Fases 3 e 7) assumiam sempre um objeto único na relação embutida `skills(nome)`, mas os tipos reais gerados pelo Supabase (só agora em jogo, pela primeira vez num build a sério) permitem também array — o mesmo problema que o padrão `unwrap()` já resolvia noutros sítios do código, só não tinha sido aplicado aqui. Corrigido nos três ficheiros com o mesmo padrão `unwrap()`, verificado no `tsc` de scratch, commitado (`fix(empregos): corrigir tipo da relação skills(nome) em 3 páginas`).

**b) Env vars do Supabase nunca configuradas na Vercel** — a página `/forgot-password` falhava a pré-renderizar por falta de `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no ambiente de build da Vercel (só existiam no `.env.local` do Yos). Resolvido adicionando as três variáveis (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`) nas Environment Variables da Vercel.

## 7. Descoberta: dois projetos Vercel para o mesmo repositório — 21:37–22:01

Durante a configuração, percebeu-se que a conta Vercel do Yos tem **dois projetos** ligados ao mesmo repositório GitHub (`jaaaneves-art/otiodojoca`): **"otiodojoca"** e **"jj"**.

- **"otiodojoca"** — nome óbvio, mas o domínio `otiodojoca.vercel.app` nunca teve um deployment de produção bem-sucedido ("No Deployment"). Foi o projeto onde configurei tudo por defeito, sem saber da existência do outro.
- **"jj"** — nome pouco óbvio, mas é o que está realmente vivo: `jj-kappa-mocha.vercel.app` com "Valid Configuration" e deployments de produção a passar com sucesso, incluindo o commit de correção de hoje.

**Decisão do Yos:** o "jj" é o projeto real, o "otiodojoca" pode ser apagado (Settings → Delete Project — ainda por fazer). O `CRON_SECRET` e as três env vars do Supabase tiveram de ser reconfiguradas no "jj" (estavam só no "otiodojoca", por engano).

## 8. Teste do endpoint do cron em produção — erro 500 por resolver — 22:10

Depois de configurar o `CRON_SECRET` no "jj" e forçar um redeploy, o `curl` já não dá 401 (autenticação a funcionar), mas dá **HTTP 500** sem corpo de resposta:

```
< HTTP/2 500
< content-length: 0
```

Sem logs de execução vistos ainda (não abrimos os Runtime Logs do deployment na Vercel para ver a stack trace real). Sessão pausada aqui, a pedido do Yos — ver `docs/pendentes/EMPREGOS-DEPLOY-VERCEL-JJ-20260830.md` para o ponto exato onde retomar.

---

## Estado do módulo no fim do dia

Roadmap do MVP completo (Fases 0–8) mais a primeira funcionalidade pós-MVP (Fase 9) — código todo escrito, testado com `tsc`/vitest de scratch, e agora também commitado e em deploy real pela primeira vez (não só testado localmente). Falta: resolver o erro 500 do endpoint de alertas, decidir sobre o projeto Vercel "otiodojoca" duplicado, e fazer o teste em browser de ponta a ponta de todo o módulo (nunca confirmado nesta sessão nem em anteriores).

## Pendentes do dia

### Prioridade 1 — Erro 500 no endpoint do cron + limpeza do projeto Vercel duplicado

**Detalhe:** `docs/pendentes/EMPREGOS-DEPLOY-VERCEL-JJ-20260830.md`.

### Prioridade 2 — Teste em browser de ponta a ponta do módulo Empregos

Nenhuma fase (3 a 9) foi confirmada testada em browser pelo Yos até agora — só a camada de base de dados (Fase 2) e, hoje, o build/deploy. Fluxo sugerido em `docs/EMPREGOS.md` secções 12–15, cada uma com a sua sugestão de teste.

### Prioridade 3 — Itens de dias anteriores ainda em aberto

Sem novidades hoje: Netuno/códigos postais, renomear StandGo, `db diff` declarativo por configurar — ver `claude/RELATORIO-COMPLETO-20260829.md`.
