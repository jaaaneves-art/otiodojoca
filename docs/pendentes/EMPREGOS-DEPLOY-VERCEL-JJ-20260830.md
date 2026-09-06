# Pendente — Deploy do módulo Empregos na Vercel (erro 500 + projeto duplicado) — 30/08/2026 22:13

Sessão pausada a meio da resolução, a pedido do Yos. Retomar exatamente por aqui.

## Contexto

Depois de aplicar as migrations das Fases 8/9 e fazer o primeiro `git push` real de todo o código do módulo Empregos (ver `claude/RELATORIO-COMPLETO-20260830.md` secções 5–8 para a narrativa completa), descobrimos que a conta Vercel do Yos tem **dois projetos ligados ao mesmo repositório** `jaaaneves-art/otiodojoca`:

- **"otiodojoca"** (`otiodojoca.vercel.app`) — nunca teve um deployment de produção bem-sucedido. Não usar.
- **"jj"** (`jj-kappa-mocha.vercel.app`) — é o projeto real, com deployments de produção a funcionar. **É este que interessa.**

## Item 1 — Erro 500 no endpoint `/api/cron/job-alerts` (por resolver)

Depois de:
1. Corrigir os 3 ficheiros com o tipo errado de `skills(nome)` (commit `fix(empregos): corrigir tipo da relação skills(nome) em 3 páginas`),
2. Configurar `CRON_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` no projeto **jj** (Environment Variables → Production),
3. Forçar um Redeploy do deployment mais recente,

o `curl` ao endpoint já não dá 401 (a autenticação por `CRON_SECRET` está a funcionar), mas passou a dar **HTTP 500 sem corpo de resposta**:

```bash
curl -v -H "Authorization: Bearer a9b9ed431798b84985ca33b2b0210fad5af46280acac4b660f5888908cf6644a" https://jj-kappa-mocha.vercel.app/api/cron/job-alerts
```

```
< HTTP/2 500
< cache-control: public, max-age=0, must-revalidate
< x-matched-path: /api/cron/job-alerts
< x-vercel-cache: BYPASS
< content-length: 0
```

**Próximo passo:** o corpo vazio não diz nada — é preciso ver os *Runtime Logs* desse pedido específico na Vercel (projeto **jj** → Observability → Logs, ou Deployments → deployment atual → Logs/Runtime Logs, filtrar por `/api/cron/job-alerts`) para apanhar a stack trace real do erro 500. Hipóteses a verificar por ordem, sem assumir nenhuma sem confirmar no log:

- A migration da Fase 9 (`20260830210000_empregos_module_fase9.sql`, tabelas `job_alerts`/`job_alert_matches`) foi mesmo aplicada com `db push` — foi, confirmado nesta sessão (secção 5 do relatório do dia) — mas vale a pena confirmar que o Supabase de **produção** que a Vercel usa é o mesmo projeto Supabase onde o `db push` correu (ver `NEXT_PUBLIC_SUPABASE_URL` configurada no jj vs. a do `.env.local` do Yos — devem ser o mesmo projeto `opdvusuwrhmbgkthscsc.supabase.co`, mas confirmar).
- `createAdminClient()` (`lib/supabase/admin.ts`) usa uma variável de ambiente diferente das `NEXT_PUBLIC_*` (normalmente `SUPABASE_SERVICE_ROLE_KEY` ou parecido, não confirmado nesta sessão qual o nome exato usado no ficheiro) — se essa variável não estiver configurada no projeto **jj**, o cliente admin falha ao ser criado, o que rebentaria logo no início do handler com uma exceção não apanhada → 500 com corpo vazio é consistente com isto. **Primeira coisa a verificar.**
- Menos provável mas a não excluir sem ver o log: alguma diferença de schema entre o que a migration criou e o que o código espera.

## Item 2 — Apagar o projeto Vercel "otiodojoca" (duplicado, nunca funcionou)

Decisão já tomada pelo Yos: apagar. Ainda por fazer — projeto **otiodojoca** → Settings → General → Delete Project (pede para escrever o nome do projeto a confirmar). Sem risco: não tem domínio próprio associado, só o `otiodojoca.vercel.app` que nunca serviu nada.

## Item 3 (fora deste pendente, mas relacionado) — Teste em browser de ponta a ponta

Só faz sentido depois do erro 500 estar resolvido. Ver `claude/RELATORIO-COMPLETO-20260830.md`, "Pendentes do dia", prioridade 2, para o fluxo sugerido.
