# Rede Social OTJ — Fase 9: comentários e reações

Data: 11 de setembro de 2026

## Resultado

A Fase 9 acrescenta conversas públicas às publicações do feed, três reações simples e notificações internas para o autor.

## Implementado

- Página individual de cada publicação em `/comunidade/feed/[id]`.
- Comentários de 1 a 1000 caracteres.
- Paginação estável de comentários por data e UUID.
- Eliminação lógica de comentários apenas pelo respetivo autor.
- Reações `Gosto`, `Adoro` e `Útil`; uma reação ativa por utilizador e publicação.
- Clicar novamente na mesma reação remove-a; escolher outra substitui a anterior.
- Contadores separados e contador total guardados na publicação para manter o feed eficiente.
- Notificações para o autor quando outra pessoa comenta ou reage.
- Atualização das notificações quando uma reação muda e remoção quando o comentário/reação desaparece.
- Atualização do feed e da conversa através do Realtime já existente, com polling de segurança.
- Proteção contra comentários duplicados e limite de 60 comentários por hora/utilizador.

## Base de dados

Migration: `supabase/migrations/20260911120000_social_module_phase9_comments_reactions.sql`

Novas tabelas:

- `public.social_post_comments`
- `public.social_post_reactions`

Novas RPC:

- `social_create_comment(uuid,text)`
- `social_delete_comment(uuid)`
- `social_toggle_reaction(uuid,text)`

## Segurança

- As tabelas permitem leitura apenas a membros autenticados e apenas quando a publicação está ativa.
- Escrita direta revogada; comentários e reações passam por RPC autenticadas.
- Autoria, limites, publicação de destino e estado ativo são verificados na base de dados.
- Utilizadores autenticados só podem alterar o campo `is_read` das suas notificações.
- Notificações associadas a conteúdo removido deixam de ficar visíveis.

## Limites desta fase

- Comentários têm apenas um nível; respostas encadeadas ficam fora desta fase.
- Não há edição de comentários.
- Não há Web Push.
- A migration foi preparada, mas não foi aplicada automaticamente ao Supabase.

## Próxima fase sugerida

Fase 10: ligações entre pessoas — seguir, seguidores e feed personalizado.
