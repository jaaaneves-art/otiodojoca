# Supabase CLI — Setup & Guia de Uso

**Data:** 20 de agosto de 2026  
**Estado:** ✅ Integração completa  
**Versão CLI:** 2.115.0  
**Ambiente:** Linux Mint, Node.js 20.20.2  

---

## 1. Resumo da Integração

Esta sessão integrou a **Supabase CLI** oficial no projecto OTJ, substituindo a abordagem anterior (SQL files soltos em `sql/`).

### Objectivo
- Usar a Supabase CLI como ferramenta oficial para versionamento e migração de schema
- Manter a BD remota (`opdvusuwrhmbgkthscsc`) sincronizada com o código local
- Preparar o projecto para evoluir schema de forma controlada e versionada

### O que foi feito

| Tarefa | Resultado |
|--------|-----------|
| Git cleanup | Removidos scripts PowerShell não-Linux |
| Node.js | Atualizado para v20.20.2 via `nvm` |
| Supabase CLI | Instalada como `devDependency` (v2.115.0) |
| Autenticação | CLI autenticada e ligada ao projecto remoto |
| Schema capturado | 87 tabelas exportadas via `db pull --declarative` |
| Estrutura criada | `supabase/` com `config.toml`, `migrations/`, `schemas/` |

### Commits desta sessão
- **38def00:** checkpoint: ambiente Mint, Node.js 20, antes de Supabase CLI
- **43af6eb:** supabase: baseline declarativo exportado de produção (db pull --declarative)
- **d62f1ee:** deps: adicionar supabase CLI como devDependency

---

## 2. Estrutura de Pastas

```
supabase/
├── config.toml              ← Configuração oficial da CLI
├── .gitignore               ← Ficheiros locais a ignorar
├── migrations/              ← Migrações incrementais (vazio por enquanto)
│   └── [YYYYMMDDHHMMSS]_descricao.sql
└── schemas/                 ← Baseline declarativo (estado actual da BD)
    ├── .pgdelta-export.json ← Metadados do diff engine
    ├── public/              ← Schema principal (87 tabelas)
    │   ├── tables/          ← Definições de tabelas
    │   ├── functions/       ← Funções PL/pgSQL
    │   ├── sequences/       ← Sequências (IDs)
    │   ├── types/           ← Tipos customizados (ENUMs, etc.)
    │   ├── views/           ← Views
    │   ├── default_privileges.sql
    │   └── schema.sql
    ├── auth/                ← Schema de autenticação (Supabase)
    ├── codigos_postais/     ← Schema separado (códigos postais)
    └── _cluster/            ← Extensões PostgreSQL
```

### Ficheiros importantes

- **`config.toml`** — Configuração local (host, porta, BD, etc.)
- **`supabase/schemas/public/tables/*.sql`** — Definição de cada tabela (lê-se facilmente)
- **`supabase/migrations/`** — **Aqui vão TODAS as mudanças de schema daqui em diante**

---

## 3. Como Usar a CLI

### 3.1 Verificar status

```bash
npx supabase status
```

Mostra se a CLI está ligada ao projecto remoto e o status da BD local.

### 3.2 Puxar schema remoto (atualizar local)

```bash
# Modo declarativo (sobrescreve supabase/schemas/)
npx supabase db pull --declarative

# Modo migrações (cria ficheiro .sql em supabase/migrations/)
npx supabase db pull
```

**Quando usar:**
- `--declarative`: raramente; só se quiseres capture completa do remoto
- Sem flag: quando há mudanças aplicadas remotamente que queres trazer para local

### 3.3 Criar nova migração

```bash
npx supabase migration new nome_descritivo_da_mudanca
```

Isto cria um ficheiro vazio em `supabase/migrations/20260820120000_nome_descritivo_da_mudanca.sql`.

**Exemplo:**
```bash
npx supabase migration new adicionar_coluna_status_marketplace_ads
# Cria: supabase/migrations/20260820120000_adicionar_coluna_status_marketplace_ads.sql
```

Edita o ficheiro com o SQL da mudança:
```sql
-- Adicionar coluna `status` à tabela marketplace_ads
ALTER TABLE public.marketplace_ads
ADD COLUMN status VARCHAR(50) DEFAULT 'active';
```

### 3.4 Testar migração localmente (com Docker)

```bash
# Inicia uma BD local (Postgres em Docker)
npx supabase start

# Aplica todas as migrações localmente
npx supabase db push

# Para o servidor local
npx supabase stop
```

### 3.5 Aplicar migração em produção (CUIDADO!)

```bash
# Ver o que vai ser aplicado (simulate)
npx supabase db push --dry-run

# Aplicar efectivamente (com confirmação)
npx supabase db push
```

**⚠️ IMPORTANTE:** Isto aplica directo ao projecto remoto! Só fazer depois de:
1. Testar localmente com `supabase start`
2. Validar que não há dados críticos em risco
3. Ter backup recente da BD remota

---

## 4. Boas Práticas

### ✅ Fazer

- **Criar uma migração por feature** — uma mudança lógica = um ficheiro
- **Nomar migrations claramente** — ex: `20260820_add_user_preferences`
- **Testar localmente antes** — sempre com `supabase start` + `db push`
- **Commit imediatamente** — migration criada = logo commit em Git
- **Documentar no SQL** — comentários explicando o quê e o porquê
- **Versionar tudo** — nunca aplicar mudanças directo no painel Supabase

### ❌ Evitar

- **Editar `schemas/` manualmente** — deixa para `db pull --declarative` regenerar
- **Múltiplas mudanças numa migration** — dividir em várias
- **Reexecutar `sql/` antigos** — aqueles são arquivo histórico, não migrations
- **Aplicar ao remoto sem testar** — sempre local primeiro
- **Ignorar erros de migração** — pode deixar a BD inconsistente

---

## 5. Fluxo Típico de Desenvolvimento

### Scenario: Adicionar nova coluna a uma tabela

1. **Criar migração**
   ```bash
   npx supabase migration new adicionar_coluna_descricao_marketplace
   ```

2. **Editar ficheiro gerado**
   ```sql
   -- supabase/migrations/20260820120000_adicionar_coluna_descricao_marketplace.sql
   ALTER TABLE public.marketplace_ads
   ADD COLUMN description_long TEXT;
   ```

3. **Testar localmente**
   ```bash
   npx supabase start
   npx supabase db push
   # Testar a mudança na BD local
   npx supabase stop
   ```

4. **Commit em Git**
   ```bash
   git add supabase/migrations/
   git commit -m "feat(marketplace): adicionar coluna description_long a marketplace_ads"
   git push
   ```

5. **Aplicar em produção**
   ```bash
   npx supabase db push
   ```

---

## 6. Referência: Relação com `sql/`

### Antes (abordagem anterior)

A pasta `sql/` continha ficheiros SQL soltos (`001-FREGUESIA-categorias.sql`, etc.). Estes **não eram versionados** pela CLI — eram apenas reference.

### Agora (abordagem Supabase CLI)

- **`sql/` → Arquivo histórico** — ler apenas, não reexecutar
- **`supabase/schemas/` → Baseline declarativa** — representação actual da BD remota
- **`supabase/migrations/` → Versão oficial** — única fonte de verdade para mudanças futuras

**Nunca mover ficheiros de `sql/` para `migrations/` directamente** — cada migração deve estar bem documentada e testada isoladamente.

---

## 7. Resolução de Problemas

### "The remote database's migration history does not match local files"

**Causa:** A BD remota tem migrations (001, 002, 003) que não estão em `migrations/` localmente.

**Solução:** Usar `db pull --declarative` para capturar o estado actual sem tentar conciliar histórico:
```bash
npx supabase db pull --declarative
```

### "Migration already exists"

**Causa:** Tentaste criar migração com timestamp que já existe.

**Solução:** Espera 1 segundo e cria de novo (o timestamp será diferente).

### BD local não inicia com `supabase start`

**Causa:** Docker não está instalado ou a rodar.

**Solução:** Instala Docker e roda `npx supabase start` novamente.

---

## 8. Próximos Passos

### Curto prazo (esta semana)
- [ ] Comparar `sql/` com `supabase/schemas/public/` para identificar diferenças
- [ ] Decidir: manter como declarative ou converter para migrations incrementais?
- [ ] Corrigir erro TypeScript em `lib/supabase/server.ts` (cookieStore)

### Médio prazo
- [ ] Testar `supabase start` localmente
- [ ] Criar primeira migração nova (ex: nova feature do marketplace)
- [ ] Validar RLS policies estão correctas

### Longo prazo
- [ ] Automatizar testes de migração em CI/CD
- [ ] Documentar políticas de RLS e segurança
- [ ] Treinar equipa no fluxo de migrações

---

## 9. Referências Úteis

- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Migrações:** https://supabase.com/docs/guides/database/migrations
- **Ambiente Local:** https://supabase.com/docs/guides/local-development

---

## 10. Histórico de Versões deste Documento

| Data | Versão | Alterações |
|------|--------|-----------|
| 2026-08-20 | 1.0 | Primeira versão; setup completo |

---

**Documento criado:** 2026-08-20  
**Próxima revisão sugerida:** Após primeira migração em produção
