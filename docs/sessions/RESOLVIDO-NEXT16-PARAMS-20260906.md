# Pendente · `params` como Promise no Next.js — rotas dinâmicas

**Aberto:** 06/09/2026
**Encontrado:** ao verificar o site depois do Sprint 10
**Gravidade:** média — páginas devolvem 404 em vez de carregar
**Estado:** ✅ **RESOLVIDO em 06/09**, ver secção final
**Não relacionado** com as alterações de segurança de hoje

---

## Sintoma

`http://localhost:3000/perfil/<uuid>` devolve **404 — This page could not
be found**. Na consola:

```
Server Error: Route "/perfil/[id]" used `params.id`.
`params` is a Promise and must be unwrapped with `await` or
`React.use()` before accessing its properties.
  at PerfilPublicoPage (page.tsx:12:22)
```

A página não está em falta. Rebenta ao ler `params.id` e o Next.js
devolve 404 como consequência.

## Causa

No Next.js 15 os `params` e `searchParams` das rotas dinâmicas passaram
a ser Promises. O código acede-lhes de forma síncrona, como no 14.

Confirmar a versão em uso:
```bash
grep '"next"' package.json
```

## Ficheiro conhecido

`app/perfil/[id]/page.tsx`, linha 12.

## Correção

Se o componente for de servidor:
```tsx
export default async function PerfilPublicoPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
```

Se for cliente (`'use client'`):
```tsx
import { use } from 'react';
const { id } = use(params);
```

## Antes de corrigir: ver a extensão

É provável que não seja o único sítio — as outras rotas dinâmicas ainda
não foram abertas desde a migração.

```bash
# rotas dinâmicas existentes
find app -type d -name "[[]*[]]" | sort

# quais usam params
grep -rln "params" app --include=page.tsx --include=route.ts

# candidatos a erro: acesso síncrono
grep -rn "params\.\w" app --include=page.tsx --include=route.ts \
  --include=layout.tsx | grep -v "await params" | grep -v "use(params)"
```

Aplica-se também a `layout.tsx`, `route.ts` e `generateMetadata`.

## Estimativa

30 a 60 minutos, consoante o número de rotas. Mecânico, sem decisões.

## Notas

- O `codemod` oficial pode tratar o grosso:
  `npx @next/codemod@latest next-async-request-api .`
  Convém rever o resultado — nem sempre apanha os casos com destructuring.
- Verificar se há mais avisos deste tipo no terminal do `npm run dev`;
  em componentes de servidor os erros não aparecem no browser.
- Testar depois: perfil público, detalhe de anúncio, detalhe de vaga,
  qualquer rota com `[id]` ou `[slug]`.


---

## ✅ Resolvido em 06/09/2026

Next.js **16.3.1** (não 15). Das 27 rotas dinâmicas, só **quatro**
acediam a `params` de forma síncrona:

| Ficheiro | Correção |
|---|---|
| `app/perfil/[id]/page.tsx` | `const { id } = await params` |
| `app/mercado-da-terra/editar/[id]/page.tsx` | idem |
| `app/agenda-agricola/plantacao/[id]/page.tsx` | `const { id: idParam } = await params` |
| `app/(freguesia)/freguesia/[slug]/page.tsx` | `await params` nas **duas** funções (`generateMetadata` e a página) |

O `grep` inicial deu ~100 resultados, quase todos falsos positivos: nas
páginas de listagem (`gran-bazar`, `viaturas`, `empregos`, `imoveis`,
`lup`, `mercado-da-terra`) o `params` é uma variável local vinda de um
`await searchParams` feito acima, e já estava correta. Em
`app/api/geocode/route.ts` é um `URLSearchParams`.

O filtro que separou o trigo do joio foi este — apanha só assinaturas
de função com `params` não-Promise:

```bash
grep -rn "params: *{" app --include=page.tsx --include=layout.tsx --include=route.ts
```

Não foi preciso o codemod: quatro ficheiros fazem-se à mão em minutos,
e o codemod numa base deste tamanho mexe em muito mais do que o
necessário.

**Armadilha que apanhámos:** correr o mesmo `sed` duas vezes duplica a
linha `const { id } = await params;` e o Turbopack falha com
`the name 'id' is defined multiple times`. Confirmar sempre com
`grep -c "await params"` antes do build.

`npm run build` passa. As quatro rotas testadas no browser.

**Nota:** a página `/mercado-da-terra/editar/30` funciona, mas não há
link para ela em lado nenhum — ver
`docs_pendentes_EDITAR-ANUNCIOS-SEM-LINK-20260906.md`. É outro assunto.
