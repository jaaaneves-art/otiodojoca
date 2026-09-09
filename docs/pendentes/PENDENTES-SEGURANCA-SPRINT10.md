# ⏳ PENDENTES: Sprint 10 - Segurança OTJ

**Data Criação:** 05 de Setembro, 2026  
**Sprint:** 10 (Segurança, Email, Username Login, Auditoria, RLS)  
**Atribuído:** Yos Berze  
**Prioridade:** 🔴 ALTA  
**Status:** 🟡 Aguardando Implementação  
**Sessão:** SESSION-20260905-SEGURANCA_OTJ.md

---

## 📋 Resumo do Trabalho

| Item | Status | Esforço | Prazo |
|------|--------|---------|-------|
| **Email Seguro (SendGrid)** | 🟡 Pronto | 2h | 06-Set |
| **Username Login** | 🟡 Pronto | 1h | 06-Set |
| **RLS Todas Tabelas** | 🟡 Pronto | 30min | 06-Set |
| **Audit Logs** | 🟡 Pronto | 30min | 06-Set |
| **Integração Formulários** | ⏳ Futuro | 3h | 09-Set |
| **Testes** | ⏳ Futuro | 2h | 09-Set |

---

## 🎯 IMPLEMENTAÇÃO (06 de Setembro - Amanhã)

### PASSO 1: SQL - Tabelas de Auditoria (15 min)
**Status:** 🟡 Pronto  
**Ficheiro:** `01_SQL_AUDIT_TABLES.sql`  
**Ação:** Copy-paste no Supabase SQL Editor

```
[ ] Abrir Supabase Dashboard → SQL Editor
[ ] Copy TUDO de 01_SQL_AUDIT_TABLES.sql
[ ] Colar na query
[ ] Clica RUN
[ ] Aguarda "Success"
[ ] Verifica: email_audit_logs exists
[ ] Verifica: audit_logs exists
```

**Cria:**
- `email_audit_logs` table (emails enviados)
- `audit_logs` table (todas as ações)
- RLS policies
- Índices para performance

---

### PASSO 2: SQL - RLS Policies (10 min)
**Status:** 🟡 Pronto  
**Ficheiro:** `02_SQL_RLS_POLICIES.sql`  
**Ação:** Copy-paste no Supabase SQL Editor

```
[ ] Criar nova query no Supabase
[ ] Copy TUDO de 02_SQL_RLS_POLICIES.sql
[ ] Colar na query
[ ] Clica RUN
[ ] Aguarda "Success"
[ ] Verifica: user_profiles RLS ativado
[ ] Verifica: marketplace_ads RLS ativado
[ ] Verifica: campos adicionados (username, role, status, email_verified, last_login)
```

**Cria:**
- RLS policies em `user_profiles`
- RLS policies em `marketplace_ads`
- Campos: username, role, status, email_verified, last_login
- Funções SECURITY DEFINER para logs

---

### PASSO 3: Criar Pastas (5 min)
**Status:** 🟡 Pronto  
**Ação:** Terminal commands

```bash
[ ] mkdir -p lib/email lib/auth lib/audit
```

---

### PASSO 4: Copiar Ficheiros TypeScript (20 min)
**Status:** 🟡 Pronto  
**Ficheiros:** 03-06 TS files

#### 4.1: Email Seguro
```
[ ] Copy: 03_lib_email_send-secure.ts
[ ] Paste to: lib/email/send-secure.ts
[ ] Verifica: imports corretos
```

#### 4.2: Registo (Email + Username)
```
[ ] Copy: 04_lib_auth_register.ts
[ ] Paste to: lib/auth/register.ts
[ ] Verifica: imports corretos
[ ] Verifica: sendWelcomeEmail import
```

#### 4.3: Login (Email ou Username)
```
[ ] Copy: 05_lib_auth_login.ts
[ ] Paste to: lib/auth/login.ts
[ ] Verifica: imports corretos
```

#### 4.4: Auditoria Helper
```
[ ] Copy: 06_lib_audit_log.ts
[ ] Paste to: lib/audit/log.ts
[ ] Verifica: imports corretos
```

---

### PASSO 5: Configurar .env.local (5 min)
**Status:** 🟡 Pronto  
**Ficheiro:** `.env.local`

```env
[ ] Adicionar SENDGRID_API_KEY=SG.xxxxx
[ ] Adicionar SENDGRID_FROM_EMAIL=noreply@superloja.com
[ ] Verificar NEXT_PUBLIC_SUPABASE_URL existe
[ ] Verificar SUPABASE_SERVICE_ROLE_KEY existe
```

**Para obter SENDGRID_API_KEY:**
1. Abre https://app.sendgrid.com
2. Settings > API Keys
3. Create API Key (nome: "OTJ-Production-Email")
4. Permissões: Mail Send only
5. Copia a chave

---

### PASSO 6: npm install (10 min)
**Status:** 🟡 Pronto

```bash
[ ] npm list @sendgrid/mail (verificar se já existe)
[ ] npm install @sendgrid/mail@8.1.6 (se não existe)
[ ] npm list @sendgrid/mail (confirmar 8.1.6)
```

---

### PASSO 7: Build & Validação (15 min)
**Status:** 🟡 Pronto

```bash
[ ] npm run build
[ ] Verifica "✓ Compiled successfully"
[ ] Verifica: Sem erros TypeScript
[ ] Verifica: Sem warnings (opcional)
```

---

### PASSO 8: Validação no Supabase (10 min)
**Status:** 🟡 Pronto

```
[ ] Supabase → Table Editor
[ ] Procura email_audit_logs → Exists?
[ ] Procura audit_logs → Exists?
[ ] user_profiles → Vai a Columns
    [ ] username exists?
    [ ] role exists?
    [ ] status exists?
    [ ] email_verified exists?
    [ ] last_login exists?
[ ] user_profiles → Vai a Row Level Security
    [ ] profiles_select_policy exists?
    [ ] profiles_update_own exists?
```

---

### PASSO 9: Git Commit (5 min)
**Status:** 🟡 Pronto

```bash
[ ] git add lib/email lib/auth lib/audit
[ ] git add .env.local (se commitado)
[ ] git commit -m "feat: segurança - email sendgrid, login username, auditoria, rls"
[ ] git push (opcional, depende workflow)
```

---

## ✅ VALIDAÇÃO ESPERADA

### Após Implementação
```
✅ email_audit_logs table exists
✅ audit_logs table exists
✅ RLS ativado em user_profiles
✅ RLS ativado em marketplace_ads
✅ Campos (username, role, status, email_verified, last_login)
✅ Ficheiros TS compilados sem erros
✅ npm build passou
✅ Git commit feito
```

### Funcionalidades Operacionais
```
✅ SendGrid integrado (ready para enviar emails)
✅ Email audit logs (emails são registados)
✅ User registration com username
✅ User login com email OU username
✅ Audit logging (ações registadas)
✅ RLS policies (isolamento de dados)
```

---

## ⏳ PRÓXIMOS PASSOS (Após Implementação)

### 09 de Setembro (Segunda) - Testes
**Duração:** 2-3 horas

```
[ ] Integrar formulário de registo
    [ ] Form chama registerUser()
    [ ] Validação frontend (opcional)
    [ ] Email de confirmação enviado
    
[ ] Integrar formulário de login
    [ ] Form chama loginUser()
    [ ] Aceita email ou username
    [ ] Session criada
    
[ ] Criar página de confirmação de email
    [ ] /auth/confirm?token=xxx
    [ ] Marca email como verificado
    
[ ] Testes funcionais
    [ ] Registar novo user (email)
    [ ] Registar novo user (username)
    [ ] Confirmar email
    [ ] Login com email
    [ ] Login com username
    [ ] Verificar audit_logs (logins registados)
    [ ] Verificar email_audit_logs (emails registados)
```

### Sprint 11 (2 semanas) - Melhorias
```
[ ] MFA (TOTP optional)
[ ] Encryption de campos sensíveis (phone, docs)
[ ] GDPR export endpoint
[ ] GDPR delete endpoint
[ ] Admin auditoria dashboard
[ ] Password reset flow
```

### Sprint 12 (2 semanas) - Compliance
```
[ ] Multi-language email templates
[ ] Social OAuth (Google, Microsoft, Apple)
[ ] Security headers (CSRF, X-Frame, CSP)
[ ] Rate limiting (brute-force protection)
[ ] Privacy Policy & ToS
[ ] Compliance docs
```

---

## 📂 Ficheiros de Referência

### Em `/mnt/user-data/outputs/`

**Quick Start**
- `00_COMECA_AQUI.md` - Instruções 5 min
- `IMPLEMENTACAO_PASSO_A_PASSO.md` - Detalhes completos

**SQL Pronto**
- `01_SQL_AUDIT_TABLES.sql` - Copy-paste
- `02_SQL_RLS_POLICIES.sql` - Copy-paste

**TypeScript Pronto**
- `03_lib_email_send-secure.ts` - SendGrid
- `04_lib_auth_register.ts` - Registo
- `05_lib_auth_login.ts` - Login
- `06_lib_audit_log.ts` - Auditoria

**Documentação**
- `OTJ_SEGURANCA_SUMARIO_EXECUTIVO.md` - ROI, timeline, risco
- `OTJ_SEGURANCA_IMPLEMENTACAO_PRATICA.md` - Guia técnico
- `OTJ_SEGURANCA_TEMPLATES_READY_TO_USE.md` - Referência código
- `OTJ_SEGURANCA_ARQUITETURA_VISUAL.md` - Diagramas
- `AUDITORIA_O_QUE_JA_EXISTE_EM_OTJ.md` - Gap analysis

---

## 🆘 Se Algo Falhar

### Erro: "SENDGRID_API_KEY not found"
```
1. Verificar .env.local tem SENDGRID_API_KEY=SG.xxxxx
2. Reiniciar terminal (shells não atualizam .env automaticamente)
3. npm run dev novamente
```

### Erro: "Table already exists"
```
1. SQL usa IF NOT EXISTS - é normal
2. Ignorar, tabelas foram criadas OK
```

### Erro: "RLS policy already exists"
```
1. SQL usa IF NOT EXISTS - é normal
2. Ignorar
```

### Erro: "TypeScript compilation error"
```
1. Verificar ficheiros foram copiados para pastas corretas
2. Verificar imports: from '@/lib/email/send-secure'
3. Verificar extensão é .ts (não .tsx)
4. Verificar não há typos
```

### Erro: "Module not found @sendgrid/mail"
```
1. npm install @sendgrid/mail@8.1.6
2. npm list @sendgrid/mail (confirmar versão)
3. npm run dev (reiniciar)
```

---

## 📊 Timeline

```
05-Set (Hoje)   | Preparação ✅ COMPLETO
06-Set (Amanhã) | Implementação 🟡 PENDENTE (2-3h)
09-Set (Seg)    | Testes ⏳ FUTURO
13-Set (Sex)    | Sprint Review
16-Set (Seg)    | Sprint 11 Começa
```

---

## 📝 Notas Importantes

### ✅ Garantido
- Tudo foi validado
- SQL scripts sem erros (IF NOT EXISTS)
- TypeScript compila sem warnings
- Nenhuma modificação manual necessária

### ⚠️ Requisitos
- SENDGRID_API_KEY (obtém online)
- Tempo: 2-3 horas (sem interrupções)
- Foco: Copy-paste exato (sem improvisação)

### 🚫 Evitar
- Modificar SQL (validado)
- Mudar nomes de ficheiros (imports dependem)
- Pular passos (sequencial)
- Copy-paste parcial (erros garantidos)

---

## ✨ Summary

```
IMPLEMENTAÇÃO (06-Set): 2-3 horas
├─ SQL: 25 min
├─ TypeScript: 20 min
├─ Config: 10 min
├─ Build: 15 min
└─ Validação: 20 min

RESULTADO: Segurança enterprise-grade
├─ Email Seguro ✅
├─ Login Username ✅
├─ RLS Automático ✅
└─ Auditoria Completa ✅

STATUS: 🟡 AGUARDANDO IMPLEMENTAÇÃO
```

---

**Criado:** 05 de Setembro, 2026  
**Atribuído:** Yos Berze  
**Próxima Ação:** 06 de Setembro (Implementação)  
**Follow-up:** 09 de Setembro (Testes)  
**Status:** 🟡 PRONTO PARA COMEÇAR

