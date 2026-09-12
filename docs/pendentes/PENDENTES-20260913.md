# Pendentes — 13 Setembro 2026

Origem: sessão de 12 Set (ver `docs/sessions/SESSAO-20260912.md`)
mais bloqueadores herdados de sessões anteriores.

---

## P0 — Segurança, fazer primeiro

### 1. Rodar `SUPABASE_SECRET_KEY`
A chave `sb_secret_...` foi impressa no terminal e no chat durante o
debug do `.env.local` a 12 Set. Ignora RLS, acesso total à BD.

- Dashboard → Project Settings → API Keys → criar nova / rotate
- Actualizar `.env.local`
- Actualizar env vars no Vercel (projeto `jj`) **e fazer redeploy**
- Revogar a antiga só depois de confirmar que a app funciona
- `grep -rl "sb_secret_" --exclude-dir=node_modules --exclude-dir=.git .`
  para garantir que não ficou noutros sítios

Segundo incidente do género — ver
`claude_INCIDENTE-SEGREDO-GITHUB-PUSH-PROTECTION-20260909.md`.
Vale a pena decidir uma prática para não repetir (nunca `cat` sobre
ficheiros de env; usar `awk` só com nomes de chave).

---

## P1 — Fechar o trabalho de ontem

### 2. Apagar ou reescrever os testes falsos
Enquanto existirem, dão cobertura aparente onde não há nenhuma.

- `tests/social/e2e-social-adesoes-minors.test.ts` — dez
  `expect(true).toBe(true)`
- `supabase/tests/security/rls-policies-block.test.sql` — o
  `EXCEPTION WHEN others THEN RAISE NOTICE 'PASS'` dá verde a qualquer
  resultado, incluindo função rebentada

Molde a seguir: `tests/e2e/social-complete.e2e.test.ts` (8/8, anon key
com sessão real).

### 3. Exercitar as RPC nunca chamadas
SQL aplicado e commitado, zero execuções. `marketplace_ad_criar` chama
`e_menor_agora()`, que esteve partida — está corrigida por arrasto mas
ninguém confirmou.

- `marketplace_ad_criar` / `_editar` / `_apagar`
- `restaurante_reserva_criar` / `_editar` / `_cancelar`
- `alojamento_reserva_criar` / `_editar` / `_cancelar`
- `job_criar` / `_editar` / `_fechar`

### 4. Verificar se há mais aritmética de datas partida
O bug do `e_menor_agora()` pode ter irmãos.

```sql
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosrc LIKE '%interval%';
```

### 5. Frontend ainda usa INSERT directo
As policies agora bloqueiam escrita directa em `social_posts`,
`social_post_comments`, `social_post_reactions`, `marketplace_ads`,
`jobs`, `restaurante_reservas`, `reservas_alojamento`. O código da app
não foi migrado para as RPC — há ecrãs que vão falhar em runtime.

Auditar `app/` e `lib/` à procura de `.from('<tabela>').insert(`.
**Não apanhado pelo build nem pelo tsc.**

---

## P2 — Bloqueadores herdados

| Item | Origem |
|---|---|
| Escutismo Fase 2 — desbloqueado, não iniciado | reconciliação de 12 Set |
| Educação — SQL auditado por executar no live | `EDUCACAO-UNIVERSIDADES-20260905.md` |
| Módulo Freguesia Fase F — só planeamento | — |
| OAuth social login | `OAUTH-SOCIAL-LOGIN-20260828.md` |
| NETUNO / códigos postais | `NETUNO-CODIGOS-POSTAIS-20260829.md` |
| StandGo / Autonex renomeação | `STANDGO-REFORCO-AUTONEX-RENOME-20260829.md` |
| DB diff declarativo não configurado | `DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md` |
| Regras de menores na publicação — decisão | `DECISAO-REGRAS-MENORES-PUBLICACAO-20260907.md` |
| SendGrid pausado, domínio definitivo | `SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md` |

---

## P3 — Almanaque (linha separada)

- Rebranding: 5 passos manuais (Opção A)
- ~12 referências a "Borda d'Água" no Vol. IV
- Anos desactualizados no PWA
- Volume XI/XII: reconciliar numeração
- Deploy do site multi-volume no Netlify
- Feiras: directório completo de Portugal

---

## Decisões em aberto

- `idade_adulto_adesoes = 18` foi gravado em `config_plataforma` como
  **provisório**. Falta decidir o que podem fazer os 16-18.
- Padrão de admin ainda inconsistente: coexistem `e_admin()`,
  `pet_is_admin()`, `diaspora_is_admin()` e verificações inline de
  `profiles.role`. Convergir para `e_admin()`.
- Naming das policies mistura PT/EN, com e sem acentos.
