# Email transacional: SendGrid + Cloudflare + Supabase Auth

**Estado:** implementado e a funcionar no domínio de teste `superloja.com`.
**Domínio de teste:** `superloja.com` (Cloudflare + SendGrid) — ainda **não** é o domínio definitivo.
**Data:** 26 de agosto de 2026.

Este documento descreve todo o processo de configuração do envio de email
transacional do projeto (confirmação de registo, recuperação de password,
notificações de segurança, etc.), que passou do SMTP da Spacemail para o
SendGrid, com o DNS gerido pela Cloudflare. Inclui também duas
funcionalidades relacionadas que foram implementadas na mesma ronda de
trabalho: MFA opcional por nível de utilizador, e templates de email
multi-idioma com bandeiras clicáveis.

Como `superloja.com` é só o domínio de testes, a secção final
["Migrar para o domínio definitivo"](#migrar-para-o-domínio-definitivo)
lista exatamente o que repetir quando o domínio de produção estiver
definido.

---

## 1. Visão geral da arquitetura

```
Utilizador → Supabase Auth (GoTrue) → SMTP custom (SendGrid) → Caixa de entrada
                                              ↑
                                DNS (Cloudflare): SPF, DKIM, DMARC
```

- O **Supabase Auth** continua a ser quem dispara os emails (confirmação,
  recuperação de password, magic link, notificações de segurança, etc.) —
  só mudou o **transporte** (SMTP), de Spacemail para SendGrid.
- A **Cloudflare** passou a gerir o DNS do domínio (antes estava no DNS por
  omissão da Spaceship, a registadora). Os registos de email já existentes
  da Spacemail (MX, SPF, SRV do autodiscover) foram preservados durante a
  migração — só foram **adicionados** registos novos para o SendGrid.
- O **SendGrid** faz a autenticação de domínio (Domain Authentication —
  DKIM) e o envio efetivo dos emails via SMTP relay
  (`smtp.sendgrid.net:587`).

---

## 2. Migração de DNS: Spaceship → Cloudflare

1. No painel da Cloudflare, foi adicionado o site `superloja.com`, o que
   gerou automaticamente uma cópia dos registos DNS existentes (incluindo
   o MX e o SRV do autodiscover da Spacemail).
2. Na Spaceship (a registadora, onde o domínio está registado — não
   precisa de ser alterada além dos nameservers), os nameservers foram
   trocados para os dois nameservers da Cloudflare indicados no painel.
3. Após a propagação, a Cloudflare mostrou "Your domain is now protected by
   Cloudflare" e o estado da zona passou a `active`.
4. **Verificação importante:** confirmar que os registos `MX` e `TXT`
   (SPF) da Spacemail foram importados corretamente e ficaram como **"DNS
   only"** (não proxied — nuvem cinzenta, não laranja). Registos de email
   nunca devem ser proxied pela Cloudflare.

Todos os registos novos criados nos passos seguintes (SendGrid + DMARC)
foram também criados como "DNS only".

---

## 3. SendGrid: Domain Authentication (DKIM)

No painel do SendGrid (Settings → Sender Authentication → Authenticate
Your Domain):

1. Domínio: `superloja.com`, sem subdomínio de branding automático.
2. O SendGrid devolveu 3 registos `CNAME` para adicionar no DNS:
   - `mail_cname` (ou `s1._domainkey` / `s2._domainkey`, conforme a
     versão da conta)
   - `dkim1._domainkey`
   - `dkim2._domainkey`
3. Esses 3 CNAME foram criados na Cloudflare via API (ver secção 4).
4. Foi também adicionado um registo `TXT` de DMARC
   (`_dmarc.superloja.com`) e mantido o SPF existente da Spacemail — o
   SendGrid não precisa de um SPF próprio separado quando os CNAME de
   autenticação de domínio estão corretos, mas o `TXT` de DMARC é
   recomendado.
5. Validação: `POST /v3/whitelabel/domains/{id}/validate` na API do
   SendGrid (endpoint legado, mas funcional — o nome "whitelabel" é
   histórico) devolveu os 3 registos (`mail_cname`, `dkim1`, `dkim2`) com
   `"valid": true`.

### Comandos de referência (API SendGrid)

```bash
# Listar domínios autenticados e o estado de validação
curl -s "https://api.sendgrid.com/v3/whitelabel/domains" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"

# Forçar nova validação de um domínio (usa o "id" devolvido acima)
curl -s -X POST "https://api.sendgrid.com/v3/whitelabel/domains/{id}/validate" \
  -H "Authorization: Bearer $SENDGRID_API_KEY"
```

---

## 4. Cloudflare: criar os registos DNS via API (terminal)

Toda a criação de registos DNS foi feita por API/terminal em vez do painel,
usando um API Token da Cloudflare. Duas armadilhas reais foram encontradas
e vale a pena documentá-las para a próxima vez:

### Armadilha 1 — Permissão errada no token

Ao criar o token em **My Profile → API Tokens → Create Token**, a
Cloudflare tem duas permissões com nomes muito parecidos:

- **Zone → DNS → Edit** ✅ (esta é a correta, para criar/editar registos)
- **Zone → DNS Settings → Edit** ❌ (controla definições da zona, NÃO dá
  permissão para criar registos)

Com a permissão errada, todas as chamadas à API `dns_records` falhavam com
um erro genérico (`code 10000, "Authentication error"`), **mesmo o token
sendo válido** (`/user/tokens/verify` confirmava `"status": "active"`).
O sintoma engana porque parece um problema de autenticação, mas é de
autorização (scope).

**Como confirmar:** ao editar o token, o resumo de permissões deve dizer
exatamente `superloja.com - DNS:Edit` (não `DNS Settings:Edit`).

### Armadilha 2 — Account ID vs Zone ID

O ID que aparece na URL do painel da Cloudflare
(`dash.cloudflare.com/{ID}/...`) é o **Account ID**, não o **Zone ID**. São
os dois hex de 32 caracteres e parecem-se, mas são entidades diferentes —
usar o Account ID onde é preciso o Zone ID também dá o mesmo erro genérico
de autenticação.

**Como obter o Zone ID correto:**

```bash
curl -s "https://api.cloudflare.com/client/v4/zones?name=superloja.com" \
  -H "Authorization: Bearer $CF_TOKEN" | python3 -m json.tool
# → campo "id" dentro do primeiro resultado é o Zone ID
```

### Criar os registos (depois de confirmado o Zone ID certo)

```bash
CF_TOKEN="cfut_..."          # token com Zone:DNS:Edit
ZONE="acb672eca1f49c51948a8a61233659ca"   # Zone ID de superloja.com (exemplo — muda por domínio)

# CNAME de autenticação (repetir para os 3: mail_cname/s1/s2, dkim1, dkim2)
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "s1._domainkey.superloja.com",
    "content": "s1.domainkey.uXXXXXXX.wl.sendgrid.net",
    "ttl": 3600,
    "proxied": false
  }'

# TXT de DMARC
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  --data '{
    "type": "TXT",
    "name": "_dmarc.superloja.com",
    "content": "v=DMARC1; p=none; rua=mailto:noreply@superloja.com",
    "ttl": 3600
  }'
```

Todas as 4 chamadas devolveram `"success": true` depois de corrigidas as
duas armadilhas acima.

---

## 5. SendGrid: API Key

1. Criada em Settings → API Keys → Create API Key, com **Restricted
   Access** e permissão de escrita apenas em **Mail Send** (não usar Full
   Access — não é preciso e é mais exposição em caso de fuga da chave).
2. A chave (`SG.xxxxx...`) é usada de duas formas:
   - Como password SMTP na configuração do Supabase (secção 6).
   - Testada diretamente via API para confirmar entrega sem depender do
     Supabase:
     ```bash
     curl -s -X POST "https://api.sendgrid.com/v3/mail/send" \
       -H "Authorization: Bearer $SENDGRID_API_KEY" \
       -H "Content-Type: application/json" \
       --data '{
         "personalizations": [{"to": [{"email": "destino@exemplo.com"}]}],
         "from": {"email": "noreply@superloja.com", "name": "otj"},
         "subject": "Teste SendGrid",
         "content": [{"type": "text/plain", "value": "teste directo"}]
       }'
     # resposta vazia (202) = aceite para entrega
     ```

**Nota de segurança:** se uma API Key parecer ter parado de funcionar
(erro `"The provided authorization grant is invalid, expired, or
revoked"`), o mais provável é ter sido revogada por engano — gerar uma
nova key e atualizar em todos os sítios onde está guardada (aqui, só no
SMTP do Supabase).

---

## 6. Supabase Auth: SMTP customizado

### 6.1 Via API (Management API)

```bash
PROJECT_REF="opdvusuwrhmbgkthscsc"   # muda por projeto
SB_TOKEN="sbp_..."                    # Personal Access Token, Account Settings → Access Tokens

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  --data '{
    "smtp_admin_email": "noreply@superloja.com",
    "smtp_sender_name": "otj",
    "smtp_host": "smtp.sendgrid.net",
    "smtp_port": "587",
    "smtp_user": "apikey",
    "smtp_pass": "SG.xxxxx...",
    "smtp_max_frequency": 60
  }'
```

### 6.2 ⚠️ Armadilha crítica: o painel é que manda

Depois deste PATCH, os campos SMTP apareciam corretamente no dump da
configuração via API — mas ao tentar customizar os templates de email
(secção 7), a API recusava com:

> `"Email template modification is not available for free tier projects
> using the default email provider. Please upgrade your plan or configure
> a custom SMTP provider."`

Isto acontecia **apesar do SMTP já estar tecnicamente configurado** via
API. A causa: o painel do Supabase
(`/project/{ref}/auth/smtp`) tem o seu **próprio estado interno** de
"Enable Custom SMTP", e é esse estado — não os campos crus de config — que
o gate de "free tier + default provider" verifica. Ao abrir o painel,
o toggle "Enable Custom SMTP" mostrava-se **ligado**, mas todos os campos
apareciam **em branco/placeholder** (mesmo a password, que só mostra
pontos), com validação a pedir campos obrigatórios.

**Fix:** preencher manualmente todos os campos **no formulário do
painel** (não só via API) e clicar **Save changes** no próprio painel:

- Sender email: `noreply@superloja.com`
- Sender name: `otj`
- Host: `smtp.sendgrid.net`
- Port: `587`
- Minimum interval between emails: `60`
- Username: `apikey` — **atenção**: o Supabase às vezes auto-preenche este
  campo com o nome do projeto (ex.: `jaaaneves-art's Project`) em vez de
  `apikey` — tem de ser corrigido manualmente para `apikey`, que é sempre
  o username fixo do SMTP relay do SendGrid.
- Password: a API Key do SendGrid.

Depois de gravar pelo painel, os pedidos de customização de templates via
API passaram a funcionar. **Conclusão prática:** sempre que o SMTP
parecer configurado via API mas o comportamento não bater certo, confirmar
e regravar pelo painel — é a fonte de verdade.

### 6.3 `mailer_autoconfirm`

Por omissão este projeto tinha `mailer_autoconfirm: true`, o que faz o
Supabase confirmar contas novas automaticamente **sem enviar/exigir** o
email de confirmação — isto mascarou, durante os testes, se o envio de
email estava mesmo a funcionar (os registos pareciam "funcionar" porque
saltavam logo para a app, não porque o email tivesse sido entregue).

Foi desligado:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  --data '{"mailer_autoconfirm": false}'
```

Com isto desligado, os registos novos passaram a exigir clicar no link
recebido por email para confirmar a conta — comportamento correto para
produção.

---

## 7. Templates de email em português (pt-PT)

Todos os **13 templates** de email do Supabase Auth foram traduzidos para
português europeu informal (tratamento por "tu"), tanto o assunto como o
conteúdo HTML:

| Template | Campo (assunto) | Campo (conteúdo) |
|---|---|---|
| Confirmação de registo | `mailer_subjects_confirmation` | `mailer_templates_confirmation_content` |
| Recuperar password | `mailer_subjects_recovery` | `mailer_templates_recovery_content` |
| Mudança de email | `mailer_subjects_email_change` | `mailer_templates_email_change_content` |
| Convite | `mailer_subjects_invite` | `mailer_templates_invite_content` |
| Magic link | `mailer_subjects_magic_link` | `mailer_templates_magic_link_content` |
| Reautenticação (código) | `mailer_subjects_reauthentication` | `mailer_templates_reauthentication_content` |
| Notif. password alterada | `mailer_subjects_password_changed_notification` | `mailer_templates_password_changed_notification_content` |
| Notif. email alterado | `mailer_subjects_email_changed_notification` | `mailer_templates_email_changed_notification_content` |
| Notif. telefone alterado | `mailer_subjects_phone_changed_notification` | `mailer_templates_phone_changed_notification_content` |
| Notif. MFA adicionado | `mailer_subjects_mfa_factor_enrolled_notification` | `mailer_templates_mfa_factor_enrolled_notification_content` |
| Notif. MFA removido | `mailer_subjects_mfa_factor_unenrolled_notification` | `mailer_templates_mfa_factor_unenrolled_notification_content` |
| Notif. método de entrada associado | `mailer_subjects_identity_linked_notification` | `mailer_templates_identity_linked_notification_content` |
| Notif. método de entrada removido | `mailer_subjects_identity_unlinked_notification` | `mailer_templates_identity_unlinked_notification_content` |

Aplicados via `PATCH /v1/projects/{ref}/config/auth`, mantendo as
variáveis de template originais do Supabase (sintaxe Go
`html/template`): `{{ .ConfirmationURL }}`, `{{ .Token }}`,
`{{ .NewEmail }}`, `{{ .Email }}`, `{{ .OldEmail }}`, `{{ .OldPhone }}`,
`{{ .Phone }}`, `{{ .FactorType }}`, `{{ .Provider }}`.

Confirmação de aplicação: o dump de configuração passou a mostrar
`mailer_subjects_custom_contents` e `mailer_templates_custom_contents`
com todas as 13 chaves a `true`.

---

## 8. Templates multi-idioma (etiquetas de bandeira, sem links)

Depois da tradução base em pt-PT, foi acrescentado a **todos os 13**
templates uma versão de cada uma das 5 línguas (português, alemão,
inglês, espanhol, francês) empilhadas no mesmo email, separadas por
`<hr>`, cada secção identificada por uma etiqueta com bandeira (🇵🇹
Português, 🇩🇪 Deutsch, 🇬🇧 English, 🇪🇸 Español, 🇫🇷 Français). O
português é sempre a primeira secção.

### Histórico: porque não são clicáveis

A primeira versão desta funcionalidade usava bandeiras clicáveis
(`<a href="#de">🇩🇪</a>`) que deviam saltar para a secção traduzida via
âncora HTML (`<div id="de">`, depois `<a name="de">` também, para tentar
compatibilidade com o Gmail). **Testado e confirmado que não funciona**
em nenhum dos dois clientes de email reais usados nos testes — Gmail e o
webmail da Spacemail — apesar de, segundo a documentação de
compatibilidade de email ([caniemail.com — Local
anchors](https://www.caniemail.com/features/html-anchor-links/)), a
combinação `name` + `id` dever funcionar em pelo menos o Gmail web.

Na prática, isto é uma limitação real de sandboxing do corpo do email
nestes clientes, sem correção possível apenas por HTML — e como não há
garantia de qual cliente cada utilizador vai usar (nem forma de testar
todos), a abordagem foi trocada para **não fingir uma interação que não
funciona**: as bandeiras deixaram de ser links e passaram a ser apenas
etiquetas visuais no topo de cada secção. Todas as línguas continuam
visíveis no mesmo email — o utilizador só precisa fazer scroll em vez de
clicar — o que funciona sempre, em qualquer cliente, sem exceções.

### Estrutura de cada template

```html
<div id="pt">
<p style="font-size:13px;text-transform:uppercase;color:#8a8a8a;">🇵🇹 Português</p>
<h2>[conteúdo em português — igual ao da secção 7]</h2>
...
</div>

<hr>

<div id="de">
<p style="font-size:13px;text-transform:uppercase;color:#8a8a8a;">🇩🇪 Deutsch</p>
[conteúdo em alemão]
</div>

<hr>
<div id="en">🇬🇧 English — [conteúdo em inglês]</div>
<hr>
<div id="es">🇪🇸 Español — [conteúdo em espanhol]</div>
<hr>
<div id="fr">🇫🇷 Français — [conteúdo em francês]</div>
```

(Os `id` em cada `<div>` foram mantidos por organização/inspeção do
HTML, mas não são usados como alvo de nenhum link — são apenas
cosméticos agora.)

### Se no futuro quiseres retomar a navegação por clique

A alternativa que garantidamente funciona em qualquer cliente é sair da
navegação por âncora dentro do email e passar a decidir a língua **antes**
de enviar — ou seja, guardar uma preferência de idioma no perfil do
utilizador e enviar cada email já só na língua escolhida (sem bandeiras
nem scroll). Isto exige mais trabalho: um campo de idioma em
`profiles`, e um [Auth Hook `send_email`](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
do Supabase para substituir o template pelo conteúdo certo por
utilizador, já que o Supabase não tem seleção de template nativa por
destinatário. Não implementado nesta ronda — fica registado como opção
para o futuro caso a variante atual (scroll manual) não seja suficiente.

### Aplicação

O JSON completo com os 13 campos foi gerado por um script Python (para
evitar erros manuais de escaping em HTML dentro de JSON) e aplicado com o
mesmo endpoint:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  --data @smtp-templates-multilang.json
```

Confirmado aplicado (dump mostra `mailer_templates_custom_contents` com
todas as 13 chaves `true`, sem erro de "free tier").

**Para editar traduções no futuro:** os textos completos das 5 línguas
por template estão apenas neste ficheiro de configuração do Supabase (não
existe uma cópia "fonte" no repositório) — para alterar, editar
diretamente no painel Supabase → Authentication → Email Templates, ou
reconstruir o JSON e voltar a fazer PATCH.

---

## 9. MFA opcional por nível de utilizador

Antes desta alteração, o middleware exigia AAL2 (MFA ativo) para
**todos** os utilizadores autenticados, sem exceção. Foi alterado para:

- `role = 'user'` (nível normal) → MFA **opcional**, sugerido no primeiro
  acesso, com botão **"Agora não"** para dispensar. Uma vez dispensado,
  não volta a ser forçado.
- `role = 'moderator'` ou `role = 'admin'` → MFA continua **obrigatório**,
  sem opção de dispensar.

### Alterações feitas

- **Migração** `supabase/migrations/20260826100000_mfa_setup_dismissed_at.sql`
  — nova coluna `profiles.mfa_setup_dismissed_at` (timestamp, nullable) +
  grant de UPDATE dessa coluna para `authenticated` (o projeto usa um
  padrão de revoke-all + grant por coluna nas policies de UPDATE da
  tabela `profiles`, por isso qualquer coluna nova editável pelo cliente
  precisa deste grant explícito). Aplicada com `npx supabase db push`.
  Espelhada também em `supabase/schemas/public/tables/profiles.sql`
  (schema declarativo do projeto).
- **`lib/supabase/middleware.ts`** — passou a ler `profiles.role` e
  `profiles.mfa_setup_dismissed_at` quando o utilizador ainda não tem MFA
  configurado (`mfaNotEnrolled`). Só força o redirecionamento para
  `/mfa/setup` se `role !== 'user'` OU se o utilizador ainda não
  dispensou a sugestão.
- **`lib/auth/actions.ts`** — nova Server Action
  `dispensarConfiguracaoMfa()` que grava `mfa_setup_dismissed_at =
  now()` no perfil do utilizador autenticado.
- **`app/(auth)/mfa/setup/page.tsx`** — passou a Server Component
  assíncrono; lê o `role` do utilizador e ajusta o texto de introdução
  (mais "recomendamos" para utilizadores normais, "obrigatório" para
  moderador/admin) e passa a prop `opcional` para o componente cliente.
- **`components/auth/mfa-setup.tsx`** — novo botão **"Agora não"**
  (variant `ghost`), visível apenas quando `opcional=true`, que chama a
  Server Action e depois redireciona para o destino original (`next`) ou
  `/perfil`.

Testado e confirmado em browser com uma conta nova de nível `user`:
ecrã de configuração mostra o texto de recomendação (não obrigatoriedade),
QR code + código manual + campo de 6 dígitos, e o botão "Agora não"
funcional que salta a configuração e chega a `/perfil`.

---

## 10. Migrar para o domínio definitivo

Quando o domínio de produção estiver definido, repetir (ou atualizar) o
seguinte, item a item — tudo o que hoje referencia `superloja.com`:

1. **Cloudflare — adicionar o novo domínio**
   - Adicionar o site novo na Cloudflare (`Add a site`).
   - Confirmar/importar os registos de email já existentes desse domínio
     (MX, SPF) e marcá-los como "DNS only".
   - Trocar os nameservers na registadora desse domínio para os da
     Cloudflare.

2. **SendGrid — nova Domain Authentication**
   - Settings → Sender Authentication → Authenticate Your Domain, para o
     novo domínio.
   - Criar os 3 CNAME (`mail_cname`/`s1`/`s2`, `dkim1`, `dkim2`) + TXT de
     DMARC na Cloudflare (usar o Zone ID do **novo** domínio — confirmar
     com `GET /zones?name=`, não reutilizar o Zone ID de `superloja.com`).
   - Validar (`POST /v3/whitelabel/domains/{id}/validate`) até os 3
     registos mostrarem `"valid": true`.
   - (Opcional) Pode reutilizar a mesma API Key do SendGrid se a conta
     SendGrid for a mesma — só a autenticação de domínio é por domínio.

3. **Supabase — atualizar SMTP**
   - `smtp_admin_email` → `noreply@<novo-domínio>` (o endereço remetente
     tem de ser um endereço do domínio recém-autenticado no SendGrid).
   - **Repetir pelo painel** (não só API): Authentication → SMTP
     Settings, atualizar o "Sender email" e clicar **Save changes** — pela
     armadilha da secção 6.2, o estado do painel é que manda.
   - `smtp_host`, `smtp_port`, `smtp_user` (`apikey`) e `smtp_pass`
     mantêm-se iguais (é a mesma conta SendGrid) — só muda o email
     remetente.

4. **Verificar `site_url` e URLs de redirecionamento**
   - Confirmar em Authentication → URL Configuration que `site_url` e a
     lista de Redirect URLs do Supabase apontam para o domínio definitivo
     da aplicação (não confundir com o domínio de email — podem ser
     domínios diferentes, ex. app em `app.exemplo.pt` e email em
     `exemplo.pt`).

5. **Rever templates de email**
   - Os 13 templates (pt-PT + multi-idioma) não têm nenhuma referência
     hardcoded ao domínio `superloja.com` — usam só variáveis
     `{{ .ConfirmationURL }}` etc., geradas automaticamente pelo Supabase
     a partir do `site_url`. **Não precisam de alteração** ao mudar de
     domínio, desde que o `site_url` (ponto 4) esteja correto.

6. **Testar de ponta a ponta no domínio novo**
   - Um registo novo → confirmar que o email de confirmação chega, o link
     aponta para o domínio certo, e o fluxo de MFA (obrigatório/opcional
     consoante o `role`) funciona como esperado.
   - Um pedido de recuperação de password → mesma verificação.

7. **Desativar/arquivar o domínio de teste** (opcional)
   - Quando `superloja.com` deixar de ser necessário, pode remover-se a
     Domain Authentication no SendGrid e a zona na Cloudflare — não afeta
     o domínio definitivo, que é independente.

---

## 11. Referência rápida — onde está cada coisa

| O quê | Onde |
|---|---|
| DNS (todos os registos) | Painel Cloudflare → `superloja.com` → DNS → Records |
| Autenticação de domínio SendGrid | Painel SendGrid → Settings → Sender Authentication |
| API Key SendGrid | Painel SendGrid → Settings → API Keys |
| SMTP do Supabase Auth | Painel Supabase → Authentication → SMTP Settings (⚠️ gravar sempre por aqui, ver secção 6.2) |
| Templates de email (13) | Painel Supabase → Authentication → Email Templates, ou API `PATCH /v1/projects/{ref}/config/auth` |
| Coluna de dispensa de MFA | `supabase/migrations/20260826100000_mfa_setup_dismissed_at.sql` |
| Lógica de MFA obrigatório/opcional | `lib/supabase/middleware.ts` |
| Ação de dispensar MFA | `lib/auth/actions.ts` |
| Ecrã de configuração de MFA | `app/(auth)/mfa/setup/page.tsx`, `components/auth/mfa-setup.tsx` |

**Segredos usados neste processo** (Personal Access Token do Supabase,
API Token da Cloudflare, API Key do SendGrid) não estão guardados neste
documento nem no repositório — foram usados apenas em terminal, em
sessão, e devem ser gerados de novo (ou revogados os antigos e criados
novos) sempre que necessário, nunca commitados.
