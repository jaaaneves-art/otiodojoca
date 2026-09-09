# Pendente · Páginas de edição de anúncios sem ponto de entrada

**Aberto:** 06/09/2026
**Gravidade:** média — funcionalidade construída e inalcançável
**Esforço:** 1–2 h

---

## O que se passa

Existem cinco rotas de edição de anúncios:

```
app/mercado-da-terra/editar/[id]
app/gran-bazar/editar/[id]
app/imoveis/editar/[id]
app/lup/editar/[id]
app/viaturas/editar/[id]
```

Todas funcionam. Confirmado por URL direto:
`http://localhost:3000/mercado-da-terra/editar/30` abre o formulário
preenchido.

Mas **nenhuma está ligada à interface**. Nas cinco páginas de "Meus
Anúncios" não há uma única ocorrência de "editar":

```bash
grep -n "editar\|Editar" $(find app -path "*meus-anuncios*" -name "page.tsx")
# vazio
```

A página de detalhe também não oferece edição — quando o anúncio é do
próprio, mostra um botão cinzento inativo "Este é o teu anúncio" onde
estaria "Enviar Mensagem".

Resultado: quem publica um anúncio não o consegue corrigir.

## Onde acrescentar

Duas hipóteses, a decidir:

1. **Meus Anúncios** — um botão "Editar" por cartão. É o sítio natural
   e resolve os cinco módulos com o mesmo padrão.
2. **Página de detalhe** — substituir o botão cinzento "Este é o teu
   anúncio" por "Editar anúncio". Menos cliques, mas mistura a vista
   pública com a de gestão.

A primeira é a mais previsível. A segunda pode ser acrescentada depois.

## Pista

O projeto tem um ficheiro `meus-anuncios-COM-EDITAR.tsx` entre os
entregáveis antigos. Sugere que esta versão chegou a ser escrita e
nunca foi aplicada. Vale a pena comparar antes de escrever de raiz:

```bash
find ~ -name "meus-anuncios-COM-EDITAR.tsx" 2>/dev/null
diff <(cat meus-anuncios-COM-EDITAR.tsx) app/mercado-da-terra/meus-anuncios/page.tsx
```

## Cuidados

- A RLS já protege: `"Autores gerem os seus anuncios"` com
  `auth.uid() = author_id`. Um link para o anúncio de outra pessoa
  daria 404, não acesso indevido. Mesmo assim, só mostrar o botão a
  quem é autor.
- A página de edição faz `notFound()` quando há erro **ou** quando não
  encontra o anúncio. Um erro de permissão aparece como 404 — foi o que
  nos confundiu no caso da página de perfil hoje. Vale a pena separar
  os dois casos ao mexer no ficheiro.
- Os cinco módulos partilham o padrão. Fazer um e replicar, em vez de
  cinco variações.

## Verificar depois

Publicar um anúncio, editá-lo pela interface, confirmar que grava, e
confirmar que o anúncio de outra pessoa não mostra o botão.
