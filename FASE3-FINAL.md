# Fase 3 — O Tio do Joca — Tipos de Anúncios (FINAL)

**Data:** 28 de julho de 2026  
**Status:** ✅ Pronto para Deploy  
**Última atualização:** Labels corrigidos

---

## 📋 Resumo Final

### Formulário de Novo Anúncio (4 Tipos)

```
Tipo de Anúncio
├─ Venda (type: "sale")
│  └─ Campos: Título, Descrição, Categoria, Tipo Preço, Preço, Localidade, Contacto
├─ Oferta (type: "offer")
│  └─ Campos: Título, Descrição, Categoria, Localidade, Contacto
├─ Procura (type: "troca")  ← MUDADO (era label "Troca")
│  └─ Campos: Título, Descrição, Categoria, O que Procuro, Desc. do que Procuro, Localidade, Contacto
└─ Troca (type: "procura")  ← MUDADO (era label "Procura")
   └─ Campos: Título, Descrição, Categoria, O que Procuro, Desc. do que Procuro, Localidade, Contacto
```

### Exibição no Mercado da Terra (futuro - F4)

```
Mercado da Terra
├─ Venda (type: "sale") → mostra €
├─ Oferta (type: "offer") → mostra "Grátis"
├─ Procura (type: "troca") 
│  ├─ "Há" (mostra title + description)
│  └─ "Que se busca" (mostra seeking + seeking_description)
└─ Troca (type: "procura")
   ├─ "Há" (mostra title + description)
   └─ "Que se busca" (mostra seeking + seeking_description)
```

---

## 📦 Ficheiros para Copiar

### 1️⃣ `ad-types.ts`
**Destino:** `C:\Users\sev7\OneDrive\otj\lib\mercado-da-terra\ad-types.ts`

Define os 4 tipos com labels corretos:
- sale → "Venda"
- offer → "Oferta"
- troca → "Procura" ✅
- procura → "Troca" ✅

---

### 2️⃣ `ad-form.tsx`
**Destino:** `C:\Users\sev7\OneDrive\otj\components\mercado-da-terra\ad-form.tsx`

Formulário dinâmico que mostra/esconde campos conforme tipo.

Campos adicionados:
- "O que Procuro" (input, name: seeking)
- "Descrição do que Procuro" (textarea, name: seeking_description)

---

### 3️⃣ `actions.ts`
**Destino:** `C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\actions.ts`

Backend que grava os anúncios.

Função `buildDetails()` grava em JSONB:
```json
{
  "seeking": "Milho em grão",
  "seeking_description": "Para semear, 10kg"
}
```

---

### 4️⃣ `ad-detail-page.tsx`
**Destino:** `C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\[id]\page.tsx`

Página de detalhe do anúncio (mostra preço ou "Grátis").

---

### 5️⃣ `meus-anúncios-page.tsx`
**Destino:** `C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\meus-anúncios\page.tsx`

Página "Meus Anúncios" com renderização dinâmica.

---

## 🚀 Instruções de Cópia e Teste

### Passo 1: Descarregar ficheiros

Todos os ficheiros estão em `/mnt/user-data/outputs/`

### Passo 2: Copiar (por esta ordem)

```powershell
# 1. ad-types.ts
Copy-Item -Path "C:\Downloads\ad-types.ts" -Destination "C:\Users\sev7\OneDrive\otj\lib\mercado-da-terra\ad-types.ts" -Force

# 2. ad-form.tsx
Copy-Item -Path "C:\Downloads\ad-form.tsx" -Destination "C:\Users\sev7\OneDrive\otj\components\mercado-da-terra\ad-form.tsx" -Force

# 3. actions.ts
Copy-Item -Path "C:\Downloads\actions.ts" -Destination "C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\actions.ts" -Force

# 4. ad-detail-page.tsx
Copy-Item -Path "C:\Downloads\ad-detail-page.tsx" -Destination "C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\[id]\page.tsx" -Force

# 5. meus-anúncios-page.tsx
Copy-Item -Path "C:\Downloads\meus-anúncios-page.tsx" -Destination "C:\Users\sev7\OneDrive\otj\app\mercado-da-terra\meus-anúncios\page.tsx" -Force
```

### Passo 3: Limpar cache e iniciar

```powershell
# No diretório do projeto
Remove-Item -Recurse -Force .next
npm run dev
```

### Passo 4: Testar

Abre: `http://localhost:3000/mercado-da-terra/novo`

**Verifica o dropdown "Tipo de Anúncio":**
- ✅ Venda
- ✅ Oferta
- ✅ **Procura** (tipo "troca")
- ✅ **Troca** (tipo "procura")

---

## 📝 Teste Prático

### Test 1: Criar anúncio "Procura"
- Tipo: **Procura**
- Título: "Tenho batatas"
- Descrição: "100kg de batatas biológicas"
- Categoria: Produtos Alimentares
- O que Procuro: "Milho"
- Descrição do que Procuro: "Milho em grão, 10kg"
- Localidade: Guimarães
- Contacto: Mensagem

**Resultado esperado no Supabase:**
- `type`: "troca"
- `details`: `{"seeking": "Milho", "seeking_description": "Milho em grão, 10kg"}`

---

### Test 2: Criar anúncio "Troca"
- Tipo: **Troca**
- Título: "Procuro milho"
- Descrição: "Para semear"
- Categoria: Produtos Alimentares
- O que Procuro: "Milho"
- Descrição do que Procuro: "Milho em grão, 10kg"
- Localidade: Guimarães
- Contacto: Email

**Resultado esperado no Supabase:**
- `type`: "procura"
- `details`: `{"seeking": "Milho", "seeking_description": "Milho em grão, 10kg"}`

---

## 🗂️ Estrutura de Ficheiros Após Cópia

```
otj/
├─ lib/mercado-da-terra/
│  └─ ad-types.ts ✅
├─ components/mercado-da-terra/
│  └─ ad-form.tsx ✅
├─ app/mercado-da-terra/
│  ├─ actions.ts ✅
│  ├─ [id]/
│  │  └─ page.tsx ✅
│  └─ meus-anúncios/
│     └─ page.tsx ✅
```

---

## ✅ Checklist de Cópia

- [ ] `ad-types.ts` copiado
- [ ] `ad-form.tsx` copiado
- [ ] `actions.ts` copiado
- [ ] `ad-detail-page.tsx` copiado
- [ ] `meus-anúncios-page.tsx` copiado
- [ ] Cache `.next` removido
- [ ] `npm run dev` iniciado
- [ ] Dropdown mostra os 4 tipos corretos
- [ ] Teste "Procura" realizado
- [ ] Teste "Troca" realizado

---

## 🔄 Próximos Passos (F4)

- [ ] Página principal `/mercado-da-terra/page.tsx` 
- [ ] Exibir 4 secções: Venda | Oferta | Procura | Troca
- [ ] Subdivir Procura e Troca em "Há" e "Que se busca"

---

**Fase 3 CONCLUÍDA!** 🎉

