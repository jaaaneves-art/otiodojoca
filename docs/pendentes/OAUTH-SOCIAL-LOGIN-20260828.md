# Pendente — Configuração real do login social (Google/Facebook) — 28/08/2026

## Estado

**Código implementado e confirmado a funcionar corretamente** (testado no browser real, 28/08/2026): os botões "Continuar com Google" e "Continuar com Facebook" chamam `supabase.auth.signInWithOAuth()` e o browser chega mesmo ao endpoint de autorização do Supabase (`/auth/v1/authorize?provider=...`) com os parâmetros certos (`redirect_to`, `code_challenge` PKCE, etc.). O único erro que aparece é:

```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

Ou seja: falta **apenas** ativar os fornecedores no Supabase Dashboard com credenciais OAuth reais — não há bug de código a resolver.

Apple foi descartado ("vamos esquecer o apple") — só Google e Facebook ficam em `components/auth/oauth-buttons.tsx`.

## Porque está parado

**Decisão do Yos (28/08/2026): só configurar isto quando tivermos o domínio definitivo do site.**

Motivo: o Redirect URI que se regista no Google Cloud Console / Facebook for Developers é o do Supabase (`https://opdvusuwrhmbgkthscsc.supabase.co/auth/v1/callback` — esse não muda), mas o **Site URL** e os **Redirect URLs** no Supabase Dashboard (`Authentication → URL Configuration`) e o ecrã de consentimento OAuth (nome da app, domínio autorizado) devem refletir o domínio final, não `otiodojoca.vercel.app` nem `localhost`. Faz mais sentido configurar tudo de uma vez com o domínio certo do que repetir o processo depois.

## Passos para quando o domínio estiver definido

### 1. Google Cloud Console

```
https://console.cloud.google.com/apis/credentials
```

- Criar/usar um projeto Google Cloud.
- Configurar o "OAuth consent screen": tipo **External**, app name `O Tio do Joca`, support email, developer contact. Pode ficar em modo "Testing" para já.
- Criar credenciais → "OAuth client ID" → tipo **Web application**.
- Authorized redirect URI (não muda, independente do domínio final):

```
https://opdvusuwrhmbgkthscsc.supabase.co/auth/v1/callback
```

- Guardar o **Client ID** e o **Client Secret** gerados.

### 2. Facebook for Developers

```
https://developers.facebook.com/apps
```

- Criar uma app tipo "Consumer" ou "Business".
- Adicionar o produto "Facebook Login".
- Valid OAuth Redirect URI — o mesmo URI do Supabase acima.
- Guardar **App ID** e **App Secret**.

### 3. Supabase Dashboard (projeto `opdvusuwrhmbgkthscsc`)

- `Authentication → URL Configuration`: atualizar **Site URL** para o domínio definitivo, e confirmar que os **Redirect URLs** incluem `https://<dominio-definitivo>/**` (manter também `http://localhost:3000/**` para dev).
- `Authentication → Sign In / Providers → Google`: ativar, colar Client ID/Secret.
- `Authentication → Sign In / Providers → Facebook`: ativar, colar App ID/Secret.

### 4. Teste

- Janela anónima, sem extensões/ad-blockers, clicar em cada botão e confirmar que completa o fluxo até cair na página inicial (`/`) já autenticado.

## Nota sobre SSO institucional (parceiros)

O Yos levantou a hipótese de que a futura **SSO institucional** para entidades parceiras (mencionada em `app/parceiros/page.tsx`: "Brevemente vamos também permitir a entrada por SSO com o email institucional... Google Workspace ou Microsoft 365 do domínio da entidade") segue um processo semelhante a este.

É uma suposição razoável mas ainda por confirmar em detalhe quando chegar a altura:
- **Google Workspace**: tecnicamente é o mesmo fluxo OAuth do Google acima (o mesmo Client ID serve) — a diferença é só restringir/reconhecer que o email pertence a um domínio institucional específico, o que teria de ser tratado no nosso código (ex: verificar o domínio do email depois do login) e não é configuração adicional no Google Cloud Console.
- **Microsoft 365 / Entra ID (Azure AD)**: é um fornecedor OAuth **diferente** do Google/Facebook — precisa de registo próprio no Azure Portal (App registrations) e o Supabase tem um provider `azure` dedicado para isto, distinto de `google`/`facebook`. Não é o mesmo processo, é um fornecedor novo a configurar quando chegar a essa fase.

Fica registado como pendente separado, não incluído neste OAuth de utilizadores individuais.

## Ficheiros envolvidos

- `components/auth/oauth-buttons.tsx` — botões Google/Facebook (Apple removido).
- `components/auth/login-form.tsx`, `components/auth/register-form.tsx` — renderizam `<OAuthButtons />`.
- `app/(auth)/auth/callback/route.ts` — `exchangeCodeForSession` genérico, já serve para OAuth sem alterações.
