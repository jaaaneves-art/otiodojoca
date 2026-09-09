# Migração de email: Spacemail → SendGrid (via Cloudflare) — Concluída 2026-08-26

## O que foi feito

1. Domínio `superloja.com` migrado de DNS no Spaceship para Cloudflare.
   - Nameservers trocados no Spaceship: `launch1.spaceship.net` / `launch2.spaceship.net` → `kevin.ns.cloudflare.com` / `mckinley.ns.cloudflare.com`.
   - Registos existentes (MX do Spacemail, SPF, SRV autodiscover, A records) importados corretamente — o email antigo (Spacemail) continuou a funcionar durante a transição.
   - Cloudflare Account ID: `5ac615e43a3d65524a5381ba1312afe4`
   - Cloudflare Zone ID (superloja.com): `acb672eca1f49c51948a8a61233659ca`

2. Domain Authentication do SendGrid para `superloja.com` — Verified.
   - SendGrid Domain Authentication ID: `32561918`
   - Registos DNS criados no Cloudflare (via API, proxy DNS only):
     - CNAME `em9518.superloja.com` → `u113273697.wl198.sendgrid.net`
     - CNAME `s1._domainkey.superloja.com` → `s1.domainkey.u113273697.wl198.sendgrid.net`
     - CNAME `s2._domainkey.superloja.com` → `s2.domainkey.u113273697.wl198.sendgrid.net`
     - TXT `_dmarc.superloja.com` → `v=DMARC1; p=none;`
   - Validação confirmada via API: `mail_cname`, `dkim1`, `dkim2` todos `valid:true`.

3. Caixa `noreply@superloja.com` criada (definitiva) como remetente.

4. SendGrid API Key criada: `otj-supabase-smtp` (Custom Access: Mail Send Full Access + Sender Authentication Full Access).

5. SMTP do Supabase (projeto `opdvusuwrhmbgkthscsc`) reconfigurado via Supabase Management API para usar SendGrid em vez do Spacemail:
   - Host: `smtp.sendgrid.net`, Porta: `587`, Username: `apikey`
   - Sender email: `noreply@superloja.com`, Sender name: `otj`

## Por confirmar / testar

- Registo de um utilizador novo em `/registo` com email nunca usado antes, para confirmar:
  - O email de confirmação chega (via SendGrid, vindo de `superloja.com`).
  - O link de confirmação funciona (fluxo `/auth/callback` → `/mfa/setup`, como documentado em `claude/AUDITORIA-REDE-SOCIAL-MFA-20260824.md`).
  - Aparece como "Delivered" no Activity Feed do SendGrid.

## Notas de segurança

- Os tokens/keys usados durante a configuração (Cloudflare API Token, Supabase Personal Access Token) foram partilhados na sessão e devem ser revogados após confirmação de que tudo funciona. A SendGrid API Key (`otj-supabase-smtp`) é permanente — fica em uso no SMTP do Supabase, não deve ser revogada.
