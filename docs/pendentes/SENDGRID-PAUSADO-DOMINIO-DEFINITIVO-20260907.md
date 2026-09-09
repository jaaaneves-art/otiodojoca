# Pendente — SendGrid (P1) pausado à espera do domínio definitivo — 07/09/2026

**Decisão do Yos:** pausar o Bloco P1 (SendGrid, `docs/pendentes/PROXIMA-SESSAO-20260907.md`)
até haver o registo do domínio definitivo. Mesmo bloqueio que já parava o
`docs/pendentes/OAUTH-SOCIAL-LOGIN-20260828.md` — os dois retomam juntos
quando o domínio estiver registado. O domínio definitivo **não está** na
Cloudflare (diferente do `superloja.com`, que é só o domínio de teste).

## O que já foi testado hoje, antes de pausar

Corrido `node teste-sendgrid.mjs <email>` (ficheiro deixado na raiz do
projeto, lê `.env.local`) contra a API direta do SendGrid
(`@sendgrid/mail`):

```
❌ 401 [{"message":"The provided authorization grant is invalid, expired, or revoked"}]
```

**Não é o erro esperado** (o pendente previa 403 de sender não verificado).
Diagnóstico feito (sem expor a chave): `SENDGRID_API_KEY` no `.env.local`
está bem formada (69 caracteres, prefixo `SG.`, sem `\r` nem aspas a mais)
mas é **inválida/revogada** para a API Web.

**Achado importante:** o Yos confirmou que a recuperação de conta (que usa
o SMTP relay do SendGrid configurado no Supabase Dashboard → Authentication
→ SMTP Settings) está a funcionar, testado no mesmo dia. Como a autenticação
SMTP do SendGrid usa literalmente a API key como password, isto indica que
**as duas chaves divergiram**: a que está gravada no Supabase é válida, a
que está no `.env.local` do projeto está morta (revogada, expirada, ou
nunca foi atualizada quando a outra foi trocada).

## Ao retomar

1. Confirmar o domínio definitivo e onde fica o DNS (não está na
   Cloudflare — verificar onde está antes de repetir o processo do
   `claude/GUIA-EMAIL-SENDGRID-CLOUDFLARE-20260826.md`, que foi escrito
   para superloja.com/Cloudflare especificamente).
2. Gerar uma API key nova no SendGrid antes de qualquer teste — a atual
   está confirmada morta. Decisão em aberto: uma key partilhada
   (`.env.local` + Supabase SMTP, sincronizadas) ou duas keys separadas
   por uso (mais correto a nível de segurança). Não decidido ainda.
3. Autenticação de domínio (DKIM) no domínio definitivo, seguindo o
   padrão do guia de 26/08, adaptado ao novo DNS host.
4. Repetir `node teste-sendgrid.mjs <email>` (já deixado na raiz do
   projeto) com a chave nova antes de dar como resolvido.

## Ficheiro deixado no projeto

`teste-sendgrid.mjs` (raiz do repositório) — lê `SENDGRID_API_KEY` e
`SENDGRID_FROM_EMAIL` do `.env.local`, com parsing tolerante a `\r`/aspas
e diagnóstico que não expõe a chave inteira. Reutilizável quando o P1
retomar.
