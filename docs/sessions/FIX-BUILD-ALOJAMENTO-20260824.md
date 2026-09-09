# Correção de erros de build — módulo Alojamento (24 de agosto de 2026)

## Contexto

`npm run build` estava a falhar no `otiodojoca` (`~/Nextcloud2/Projectos/otiodojoca`)
com 8 erros de TypeScript, todos dentro do módulo de Alojamento (`/alojamento`,
distinto do Gran Bazar e dos Parceiros — reservas de casas rurais, pousadas,
hotéis, etc.). Nada disto estava relacionado com o trabalho de leilões/parceiros
das sessões anteriores; é um módulo à parte que também compõe o build.

## Erros e correções

1. **`app/(alojamento)/alojamento/[id]/page.tsx`** — `params.id` é sempre
   `string` (rota dinâmica do Next.js), mas `obterAlojamentoComRefeicoes()`
   espera `number`. Corrigido com `Number(id)` + guarda para `NaN` (id
   inválido → `notFound()`/metadata "não encontrado" em vez de rebentar a
   query).

2. **Mesmo ficheiro** — `dados.imagem` e `dados.comodidades` eram lidos e
   renderizados condicionalmente, mas **nunca existiram** nem no tipo
   `Alojamento`/`AlojamentoComRefeicoes` nem na tabela `alojamentos` (confirmado
   nas migrations `20260821180000_mock_alojamentos_teste.sql` e
   `20260821190000_alojamentos_morada_e_refeicoes.sql` — colunas reais:
   `nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, num_camas,
   rating, telefone, email, website`). Era código morto que nunca teria nada
   para mostrar; removido (bloco de imagem + secção "Comodidades" + import
   não usado de `next/image`) em vez de inventar colunas na base de dados.

3. **`lib/alojamento/actions.ts`** — `normalizarLocalizacao()` (função que
   normaliza a relação embutida do PostgREST, que às vezes vem como array,
   às vezes como objeto único) devolvia o mesmo tipo genérico `T` recebido,
   sem refletir a normalização feita em runtime. Isso fazia o TypeScript
   continuar a ver `localizacao` como array depois do `.map()`, e os casts
   `as Alojamento[]` em `listarAlojamentos`, `filtrarAlojamentosPorTipo` e
   `filtrarAlojamentosPorPreco` falhavam por "sobreposição insuficiente"
   (TS2352). Corrigido tipando o retorno da função como
   `Omit<T, 'localizacao'> & { localizacao: Localizacao | null }`, que é o
   que ela de facto produz.

4. **`components/alojamento/reserva-form.tsx`** — a interface local
   `RefeicaoOpcao` exigia `preco_extra: number` obrigatório, mas o tipo
   real `RefeicaoAlojamento` (de `lib/alojamento/tipos.ts`) tem
   `preco_extra?: number` (opcional). Substituída a interface local pela
   importação direta de `RefeicaoAlojamento`, eliminando a duplicação e a
   divergência de tipos.

## Resultado

`npx tsc --noEmit` e `npm run build` correm limpos (39/39 páginas geradas,
incluindo `/alojamento` e `/alojamento/[id]`). Confirmado visualmente pelo
utilizador em `npm run dev` — página de detalhe carrega bem (nome,
localização, preço, descrição, formulário de reserva), sem a secção
"Comodidades" removida.

## Nota para sessões futuras

O item "confirmar que `npm run build` corre limpo até ao fim", deixado
pendente em `claude/RELATORIO-LEILOES-GRAN-BAZAR-20260823.md`, referia-se a
um erro diferente (dashboard do Almanaque, já corrigido nessa altura). Este
documento cobre um bloqueio de build separado, encontrado só agora no
módulo de Alojamento. Ficheiros com nomes como `imagem`/`comodidades` em
`Alojamento` continuam a não existir na base de dados — se esta
funcionalidade vier a ser pedida a sério (fotos do alojamento, lista de
comodidades), precisa de migration nova + campos no `select()` das actions,
não só de UI.
