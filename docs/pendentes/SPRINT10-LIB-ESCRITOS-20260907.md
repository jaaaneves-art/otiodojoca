# Pendente — Sprint 10: os 4 ficheiros TypeScript, versão enxuta — 07/09/2026

**Estado: `npm run build` confirmado limpo pelo Yos** (`✓ Compiled
successfully`, `✓ Finished TypeScript in 3.6s`, sem nenhum erro nos 4
ficheiros novos). Falta só o commit — ver secção final. Fecha o código do
Sprint 10; o resto ("Por integrar" abaixo) é conscientemente Sprint 11.

**Substitui a lista de cópia direta do `PENDENTES-SEGURANCA-SPRINT10.md`
(05/09) e do Bloco P2 do `docs/pendentes/PROXIMA-SESSAO-20260907.md`.**
Ao procurar `03_lib_email_send-secure.ts`, `04_lib_auth_register.ts`,
`05_lib_auth_login.ts` e `00-tabelas.ts` para copiar tal e qual, dois
achados mudaram o plano:

1. **Os ficheiros não foram encontrados.** Só `06_lib_audit_log.ts` e o
   SQL final (`SPRINT10-FINAL.sql` = migration `20260906140000_sprint10_seguranca.sql`,
   já aplicada) sobreviveram à correção do dia 06/09. Vasculhado
   `~/Transferências` (raiz + `lib/`, `docs/`, `scripts/`, `app/`,
   `supabase/`, `components/`, `para-clonar/`) e o zip com nome mais
   parecido (`otj-registos-auth-secure.zip`) — é um protótipo antigo e
   diferente (registo de parceiros), não este pacote.
2. **O registo já funciona.** `components/auth/register-form.tsx` chama
   `supabase.auth.signUp()` diretamente do browser, já recolhe username,
   já dispara o email de confirmação — testado de ponta a ponta a 28/08
   (`claude/TESTE-REGISTO-EMAIL-MFA-20260828.md`). Escrever
   `lib/auth/register.ts` como "registerUser()" completo teria sido
   código morto ao lado do que já funciona.

## O que foi escrito (verificado com `tsc --noEmit`, tipos reais instalados)

- **`lib/audit/log.ts`** — cópia do `06_lib_audit_log.ts` encontrado,
  só a trocar o `servico()` inline por `createAdminClient()` de
  `lib/supabase/admin.ts`, que já existia e fazia exatamente o mesmo
  (evita duplicar o helper).
- **`lib/email/send-secure.ts`** — novo. Envio via API direta do
  SendGrid (`@sendgrid/mail`), regista sempre em `email_audit_logs`
  (sucesso ou falha), nunca lança. **Não vai funcionar em runtime** até
  o P1 (SendGrid) ficar resolvido — ver
  `docs/pendentes/SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md`. O
  `tsc` apanhou e corrigiu um bug real: `@sendgrid/mail` exige, no
  tipo, que `text` ou `html` seja uma string definida, não os dois
  opcionais ao mesmo tempo.
- **`lib/auth/username-check.ts`** — novo, `usernameDisponivel()`. A
  peça que faltava a sério: a tabela `reserved_usernames` existe mas
  nada a consultava. **Não sei se a tabela já tem alguma linha** — não
  consegui correr uma query direta contra a base nesta sessão. Se
  estiver vazia, esta função nunca bloqueia nada até se decidir e
  popular a lista de nomes proibidos.
- **`lib/auth/login.ts`** — novo, `resolverIdentificadorLogin()`.
  Resolve username → email antes de `signInWithPassword()`. Lê
  `profiles.email` por service role, de propósito — essa coluna não
  tem GRANT de SELECT para `authenticated`/`anon`. Devolve sempre
  `null` para username inexistente (nunca um erro distinto), para não
  abrir enumeração de contas.

## Por integrar (Sprint 11, decisão consciente de não fazer ainda)

- `RegisterForm` chamar `usernameDisponivel()` antes de `signUp()`.
- `LoginForm` chamar `resolverIdentificadorLogin()` quando o campo não
  parecer um email, antes de `signInWithPassword()`.
- Popular `reserved_usernames` com a lista de nomes a proteger — por
  decidir com o Yos.
- `send-secure.ts` só é testável depois do domínio definitivo + chave
  nova do SendGrid.

## Por fazer — commit

Ainda não commitado (esta sessão não corre `git` no teu computador):

```bash
cd ~/Nextcloud/Projectos/otiodojoca
git add lib/audit/log.ts lib/email/send-secure.ts lib/auth/username-check.ts lib/auth/login.ts
git commit -m "feat(sprint10): audit log, envio SendGrid, verificacao de username e resolucao de login por username"
```
