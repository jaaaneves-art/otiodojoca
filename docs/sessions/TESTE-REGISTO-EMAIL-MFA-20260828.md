# Teste do fluxo registo → email (SendGrid) → MFA — 2026-08-28

Continuação de `claude/RESUMO-MIGRACAO-SENDGRID-CLOUDFLARE-20260826.md` e
`claude/AUDITORIA-REDE-SOCIAL-MFA-20260824.md`. Primeiro teste real de
ponta a ponta depois da migração de email para SendGrid.

## Bug encontrado e corrigido: Redirect URLs vazio

No Dashboard do Supabase (`opdvusuwrhmbgkthscsc`) → **Authentication → URL
Configuration**, a lista de **Redirect URLs estava completamente vazia**
("No Redirect URLs"). O Site URL sozinho (`http://localhost:3000`) não
chega — sem entradas na allow-list, o link de confirmação do email cai
para o Site URL genérico em vez de `/auth/callback`, o que quebra a troca
do código pela sessão (`exchangeCodeForSession`).

**Corrigido:** adicionadas duas entradas em Redirect URLs:
- `http://localhost:3000/**`
- `https://otiodojoca.vercel.app/**`

## Verificações feitas antes do teste (todas confirmadas OK)

- `Authentication → Emails → SMTP Settings`: Enable custom SMTP ON,
  Sender email `noreply@superloja.com`, Sender name `otj`, Host
  `smtp.sendgrid.net`. Porta/username/password confirmados preenchidos
  pelo Yos (porta 587, username `apikey`, password presente).
- `Authentication → Sign In / Providers`: **Confirm email** ativado,
  **Allow new users to sign up** ativado.

## Teste de registo — resultado: SUCESSO (primeira vez de ponta a ponta)

1. Servidor reiniciado limpo (`rm -rf .next && npm run dev`) — arrancou
   sem erros, `Ready in 315ms`.
2. Registo em `/registo`, janela anónima, email novo nunca usado antes.
3. Conta criada — não foi direto para `/mfa/setup`/`/perfil` (esperava
   confirmação por email, comportamento correto).
4. Email de confirmação chegou (via SendGrid).
5. Link de confirmação clicado → caiu em `/mfa/setup`, QR code mostrado
   corretamente.

Isto confirma que a correção do Redirect URLs resolveu o problema — é a
primeira vez que o fluxo completo (SMTP SendGrid + Confirm email +
`/auth/callback` + `/mfa/setup`) funciona sem intervenção manual.

## Por fazer — pausado a meio, retomar aqui

O Yos parou depois do QR aparecer, antes de completar o enrollment. Falta:

1. **Completar o MFA:** digitalizar o QR com uma app TOTP, introduzir o
   código de 6 dígitos, confirmar que cai em `/perfil`.
2. **Confirmar login normal (AAL2):** logout → login com a mesma conta →
   deve pedir só `/mfa/verify` (código de 6 dígitos), **não** voltar a
   mostrar o QR/`/mfa/setup`.
3. **Confirmar proteção sem sessão:** aba anónima nova → tentar aceder a
   `/perfil` diretamente → deve mandar para `/login`.

Só depois destes 3 pontos é que o fluxo de email+MFA fica dado como
100% validado — e só depois disso faz sentido avançar para a FASE 7
(rede social: `follows`, `groups`, `comments`/`reactions` genéricos,
mensagens genéricas, `post_media`, Storage, Realtime, páginas do feed).

## Nota lateral — verificar noutra sessão

O projeto no Dashboard do Supabase mostra a etiqueta **"EXCEEDING USAGE
LIMITS"** junto do nome da organização (`jaaaneves-art's Org`, plano
FREE). Não bloqueou o teste de hoje, mas vale a pena confirmar em
Settings → Billing o que está a ser excedido, para não vir a afetar o
envio de emails ou outra funcionalidade mais tarde.
