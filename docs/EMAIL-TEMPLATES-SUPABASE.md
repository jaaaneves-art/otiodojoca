# Templates de email do Supabase Auth

**Domínio de teste:** `superloja.com` (ver [`EMAIL-SENDGRID-CLOUDFLARE.md`](./EMAIL-SENDGRID-CLOUDFLARE.md) para a configuração de SMTP/DNS).
**Data:** 26 de agosto de 2026.

O Supabase Auth tem 13 templates de email fixos (não é possível criar
templates novos, só customizar estes). Todos os 13 estão atualmente:

- Traduzidos para português europeu informal (tratamento por "tu").
- Com as 5 línguas (português, alemão, inglês, espanhol, francês)
  empilhadas no mesmo email, separadas por `<hr>`, cada uma identificada
  por uma etiqueta com bandeira (🇵🇹 Português, 🇩🇪 Deutsch, 🇬🇧 English,
  🇪🇸 Español, 🇫🇷 Français). Português é sempre a primeira secção. As
  bandeiras **não são links clicáveis** — ver nota abaixo sobre porquê.

Cada template tem um campo de **assunto** (`mailer_subjects_*`) e um de
**conteúdo** (`mailer_templates_*_content`), configuráveis em
Authentication → Email Templates no painel do Supabase, ou via API
(`PATCH /v1/projects/{ref}/config/auth`).

---

## Os 6 templates de ação (disparados por um pedido do utilizador)

| # | Template | Quando é enviado | Variáveis principais |
|---|---|---|---|
| 1 | **Confirmação de registo** (`confirmation`) | Ao criar conta nova, para confirmar o email. | `{{ .ConfirmationURL }}` |
| 2 | **Recuperar palavra-passe** (`recovery`) | Ao pedir reposição de password. | `{{ .ConfirmationURL }}` |
| 3 | **Mudança de email** (`email_change`) | Ao pedir para trocar o email da conta — confirma o novo endereço. | `{{ .ConfirmationURL }}`, `{{ .NewEmail }}` |
| 4 | **Convite** (`invite`) | Quando alguém (ex. um admin) convida uma pessoa a criar conta. | `{{ .ConfirmationURL }}` |
| 5 | **Magic link** (`magic_link`) | Login sem password, só por link enviado ao email. | `{{ .ConfirmationURL }}` |
| 6 | **Reautenticação** (`reauthentication`) | Código de 6 dígitos pedido antes de ações sensíveis (ex. mudar password estando já autenticado). | `{{ .Token }}` |

## Os 7 templates de notificação de segurança (avisam de uma alteração já feita)

| # | Template | Quando é enviado | Variáveis principais |
|---|---|---|---|
| 7 | **Palavra-passe alterada** (`password_changed_notification`) | Depois de a password da conta ser alterada. | — |
| 8 | **Email alterado** (`email_changed_notification`) | Depois de confirmado um novo email. | `{{ .OldEmail }}`, `{{ .Email }}` |
| 9 | **Telefone alterado** (`phone_changed_notification`) | Depois de o número de telefone da conta mudar. | `{{ .OldPhone }}`, `{{ .Phone }}` |
| 10 | **MFA adicionado** (`mfa_factor_enrolled_notification`) | Depois de ativar a verificação em duas etapas. | `{{ .FactorType }}` |
| 11 | **MFA removido** (`mfa_factor_unenrolled_notification`) | Depois de desativar a verificação em duas etapas. | `{{ .FactorType }}` |
| 12 | **Método de entrada associado** (`identity_linked_notification`) | Depois de ligar uma conta externa (ex. Google) à conta. | `{{ .Provider }}`, `{{ .Email }}` |
| 13 | **Método de entrada removido** (`identity_unlinked_notification`) | Depois de desligar uma conta externa. | `{{ .Provider }}`, `{{ .Email }}` |

### ⚠️ Estas 7 notificações estão desativadas

Cada uma das notificações 7–13 tem um interruptor próprio,
independente de estarem traduzidas: `mailer_notifications_*_enabled`.
No estado atual do projeto (dump de configuração de 26/08/2026), estão
**todas a `false`** — ou seja, mesmo já traduzidas e com bandeiras, **não
estão a ser enviadas**. Um evento de segurança (ex. mudar a password)
não dispara atualmente nenhum email de aviso ao utilizador.

Para ativar, PATCH ao endpoint de configuração de auth com os campos
correspondentes, por exemplo:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  --data '{
    "mailer_notifications_password_changed_enabled": true,
    "mailer_notifications_email_changed_enabled": true,
    "mailer_notifications_phone_changed_enabled": true,
    "mailer_notifications_mfa_factor_enrolled_enabled": true,
    "mailer_notifications_mfa_factor_unenrolled_enabled": true,
    "mailer_notifications_identity_linked_enabled": true,
    "mailer_notifications_identity_unlinked_enabled": true
  }'
```

Podem ser ativadas todas de uma vez ou só algumas — não são
dependentes entre si.

---

## Estrutura de cada email (5 línguas empilhadas)

```html
<div id="pt">
<p>🇵🇹 Português</p>
<h2>...</h2>
...
</div>

<hr>
<div id="de"><p>🇩🇪 Deutsch</p>...</div>
<hr>
<div id="en"><p>🇬🇧 English</p>...</div>
<hr>
<div id="es"><p>🇪🇸 Español</p>...</div>
<hr>
<div id="fr"><p>🇫🇷 Français</p>...</div>
```

### Porque as bandeiras não são clicáveis

A primeira versão usava bandeiras como links de âncora
(`<a href="#de">🇩🇪</a>` → `<div id="de">`, depois também
`<a name="de">` para tentar compatibilidade extra com o Gmail).
**Testado em dois clientes de email reais — Gmail e o webmail da
Spacemail — e não funcionou em nenhum dos dois**: o clique não salta
para a secção traduzida. É uma limitação de sandboxing do corpo do
email nesses clientes, não corrigível só por HTML (ver [caniemail.com —
Local anchors](https://www.caniemail.com/features/html-anchor-links/)
para o detalhe de suporte por cliente).

Como não há forma de garantir em que cliente cada utilizador vai abrir o
email, a solução foi não fingir uma interação que não funciona: as
bandeiras passaram a ser apenas etiquetas visuais, e todas as línguas
ficam visíveis fazendo scroll — funciona sempre, sem exceções.

**Alternativa para o futuro**, se scroll manual não for suficiente: guardar
a língua preferida no perfil do utilizador e enviar cada email já só
nessa língua (sem stacking, sem bandeiras), via um [Auth Hook
`send_email`](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook)
do Supabase. Não implementado nesta ronda.

---

## Onde editar

- Painel: Supabase → Authentication → Email Templates (um separador por
  template, mostra Subject + campo de conteúdo).
- API: `PATCH /v1/projects/{ref}/config/auth`, campos
  `mailer_subjects_<nome>` e `mailer_templates_<nome>_content`.
- Script gerador local (para reconstruir os 13 de uma vez, evita erros de
  escaping HTML dentro de JSON): `build_templates.py`, que escreve
  `smtp-templates-multilang.json` — depois aplicado com o PATCH acima
  usando `--data @smtp-templates-multilang.json`.
