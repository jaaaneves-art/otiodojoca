# Relatório — Leilões do Gran Bazar (22–23 de agosto de 2026)

## Ontem (22 de agosto): auditoria

Foram-me apresentadas, ao longo do dia, **8 propostas diferentes** de motor de leilões vindas de outras sessões de IA (zips e documentos colados). Seguindo o pedido explícito de "auditar primeiro, construir depois", nenhuma foi integrada nesse dia — só analisada, e nos casos em que havia código real, executada de facto (`npm test`, `tsc --noEmit`), não só lida.

Resultado da auditoria: 5 das 8 propostas usavam *proxy bidding* (licitação com valor máximo secreto), mecanismo que foi descartado assim que ficou decidido — por ti, através de uma pergunta direta — que o Gran Bazar usaria **licitação ascendente simples** (cada licitador escreve o valor exato que está disposto a pagar). Essa decisão sozinha eliminou a maioria das propostas, porque a tabela real `marketplace_auction_bids` só tem uma coluna `amount`, sem espaço para guardar um máximo secreto.

Ficou identificado o pacote **"Nível 4"** (o único construído em cima do schema real `marketplace_auctions`/`marketplace_auction_bids`) como base certa, com 6 correções necessárias antes de integrar:

1. Migração não idempotente nas políticas de RLS.
2. Falta de idempotência nos lances (reenvio de rede podia duplicar).
3. Política de RLS do dono do leilão sem restrição de estado (podia alterar/apagar o leilão a qualquer momento).
4. Falta de *casts* explícitos `::numeric`/`::timestamptz` ao ler o JSON de criação.
5. Risco de colisão de nome no campo `type` (confirmado inofensivo).
6. Bug de fuso horário no `datetime-local` do formulário.

Tudo isto ficou registado no documento do projeto `claude/AUDITORIA-AUCTION-ENGINE-V0.2.0.md`.

## Hoje (23 de agosto): construção real

Deste-me luz verde para construir a sério. Foi implementado o pacote "Nível 4", com as 6 correções da auditoria já aplicadas, mais uma sétima encontrada só ao ligar a interface:

- **Migração nova** (`supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql`): trigger que cria o leilão automaticamente quando um anúncio é publicado como "Leilão"; política de RLS corrigida (o dono só pode ajustar o leilão antes de começar, nunca apagar); lances com idempotência (`request_id` + índice único); função `gran_bazar_place_bid()` (a única forma válida de licitar, com *lock* de linha — sem condição de corrida); função `gran_bazar_advance_auctions()` (fecha leilões e define o vencedor).
- **7ª correção, encontrada durante a implementação**: a política de leitura só mostrava o leilão enquanto o anúncio estivesse "ativo" — mas ao terminar, o anúncio passa a "vendido"/"expirado", o que escondia o resultado final (vencedor, preço) exatamente quando isso interessava. Corrigido.
- **Interface**: "Leilão" passou a ser um tipo de anúncio normal e selecionável (deixou de estar desativado); formulário com preço inicial, incremento mínimo, início e fim, com conversão de fuso horário correta; painel de licitar na página do anúncio; listagem `/gran-bazar/leiloes` deixou de ser "em breve".
- **Contador ao vivo** (pedido teu, feito a seguir): tempo restante em tempo real, com o esquema de cores pedido — verde a mais de 1h, amarelo a menos de 1h, vermelho a menos de 5 min, a piscar cada vez mais depressa e mais intensamente no último minuto. Construído primeiro só no painel do anúncio; depois, a pedido teu, extraído para um componente partilhado (`AuctionCountdownBadge`) e replicado também nos cartões da listagem principal e em `/gran-bazar/leiloes`, para ficar consistente nos três sítios.

Do teu lado, aplicaste a migração e agendaste `gran_bazar_advance_auctions()` no `pg_cron` (a correr a cada minuto — confirmado pelo `schedule: 1` devolvido).

### Bugs apanhados pelo caminho (fora do âmbito dos leilões)

- **Limite de 1MB nos Server Actions do Next.js**: qualquer anúncio (não só leilões) com pelo menos uma foto real anexada estava a falhar a publicar, porque o Next.js limita o corpo dos Server Actions a 1MB por omissão e o upload de imagens permite até 5 fotos de 5MB. Corrigido em `next.config.js` (limite subido para 15MB).
- **Erro de build no dashboard do Almanaque** (`components/almanaque/dashboard/dashboard-main-page.tsx`): um parêntesis a mais numa conta de percentagem impedia o `npm run build` de compilar. Não tinha nada a ver com os leilões — corrigido por estar a bloquear o teste.
- **Botão "Leilão" duplicado**: ao tornar "Leilão" um tipo selecionável, acrescentei sem querer um separador de filtro igual a um que já existia (o "Leilões" que já levava à página dedicada). Revertido.

## O que falta fazer

- **Confirmar que `npm run build` corre limpo até ao fim.** Só verifiquei e corrigi o primeiro erro de TypeScript que apareceu (no dashboard do Almanaque) — não voltámos a correr o build depois disso, por isso não está confirmado que não há mais nenhum erro escondido atrás desse.
- **Testar o ciclo completo de um leilão a sério**: licitar com uma segunda conta, confirmar que o valor mínimo e o incremento são respeitados, e — mais importante — deixar um leilão de teste chegar ao fim e confirmar que o `pg_cron` o fecha sozinho, define o vencedor, e que a página mostra corretamente "Parabéns, ganhaste" ou "Terminado sem lances".
- **Confirmar os registos do `pg_cron`** (`select * from cron.job_run_details where jobid = 1 order by start_time desc limit 5;`) para veres se as execuções de minuto a minuto estão mesmo a ter sucesso, não só a existir.
- **Ficheiro estranho na raiz do projeto**: reparei que existe um ficheiro chamado literalmente `upabase db push --dry-run` (parece ter sido criado sem querer, provavelmente um comando colado sem o `>` a apontar para onde devia). Não mexi nele — fica para a tua limpeza manual, tal como já combinámos para todos os ficheiros soltos/órfãos.
- **Limpeza manual de ficheiros soltos/órfãos** em geral: continua por fazer, tal como decidido desde o início — não apago nada disso sem indicação tua.

## A seguir: Almanaque

Combinado — a partir daqui passamos para o Almanaque. Preciso que me digas por onde queres começar (há um erro de build que já corrigi de raspão nesse módulo, mas não sei se é isso que tinhas em mente, ou se é outra coisa completamente diferente que querias tratar).
