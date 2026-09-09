# Módulo social — Fase 6: Realtime e notificações

**Data:** 2026-09-09. **Estado:** implementação local; verificações limitadas
concluídas. Sem aplicação de migrations, commit, push ou execução em produção.

## Implementação

- Realtime integrado na caixa `/mensagens` e nas páginas `/mensagens/[id]`.
- Um canal por componente subscreve apenas INSERT/UPDATE da linha do utilizador
  em `social_realtime_state`, filtrada por `user_id` e protegida por RLS.
- A linha contém apenas `user_id` e um contador `revision`: não publica mensagens,
  texto, conversation_id, links, metadados de anexos ou URLs assinadas.
- O evento agenda `router.refresh()` com uma janela de agrupamento de 200 ms.
  O Next.js atualiza os Server Components sem recarregar o documento e conserva
  o estado local não afetado, incluindo o rascunho. Os dados visíveis continuam
  a vir de consultas autenticadas sob RLS; payloads do socket não são inseridos
  diretamente no histórico nem usados como contagens.
- INSERT de mensagem e soft delete sinalizam os participantes da conversa direta.
  Entrada/saída de participante, avanço de leitura e alterações de leitura das
  notificações sociais também sinalizam o utilizador correspondente.
- O polling de 15 segundos permanece ativo como rede de segurança, mesmo quando
  o canal indica sucesso: recupera eventos perdidos e cobre uma publicação ainda
  não aplicada. Atualizações visuais só são pedidas com o separador visível.
- Subscrever/reconectar, recuperar rede, regressar ao separador e recuperar foco
  originam nova consulta. Falhas de canal tentam recriação após cinco segundos.
- A interface indica ligação Realtime ou atualização automática por polling.

A publicação inclui **apenas a nova tabela de sinais**. Não são acrescentadas as
 tabelas `messages`, `message_media`, `notifications` ou `conversation_participants`
à publicação. Não é necessário REPLICA IDENTITY FULL. A migration não remove nem
modifica relações já publicadas. O suporte a DELETE não é subscrito; não existe
payload de conversa no sinal, mesmo no caso de eliminação administrativa de uma
conta. Os filtros do cliente reduzem tráfego; a RLS é a fronteira de autorização.

## Notificações in-app

`notifications.social_message_id` associa a notificação à mensagem social. É
nullable para preservar as notificações existentes e as dos outros módulos.
Um índice único parcial em `(user_id, social_message_id)` garante uma notificação
por mensagem e destinatário. O trigger usa `ON CONFLICT DO NOTHING`.

- Criação na mesma transação do INSERT da mensagem, exclusivamente para conversas
  diretas e para participantes diferentes do remetente.
- Texto genérico: “Recebeste uma mensagem privada.” Sem cópia do conteúdo ou do
  nome de ficheiros. Tipo `message` e link para a conversa.
- Uma mensagem inserida já com `deleted_at` não gera notificações.
- O autor não recebe notificação do próprio envio.
- Reconexões, polling e eventos repetidos não criam notificações. A unicidade
  refere-se ao UUID persistido da mensagem; dois envios que criem mensagens com
  UUIDs diferentes continuam a ser duas mensagens distintas.
- A caixa de entrada mostra o total de notificações sociais por ler e as cinco
  mais recentes, com links. As consultas de notificações já existentes no perfil
  também passam a incluir estas notificações ao carregar o perfil; não foi
  acrescentado um canal global noutras páginas.
- `social_mark_read` avança a leitura até à última mensagem recente efetivamente
  apresentada e marca as notificações do utilizador até esse instante como lidas.
  Consultar páginas antigas não marca mensagens recentes como lidas.
- Sem avanço da leitura e sem notificações pendentes não há escritas: evita o
  ciclo leitura → sinal → refresh → leitura. A tentativa de registar leitura é
  repetida em caso de rede indisponível, sem sobreposição dentro do mesmo efeito.
- Uma policy restritiva adicional oculta notificações sociais de mensagens
  apagadas ou conversas às quais o utilizador já não tem acesso. As policies de
  proprietário anteriores continuam obrigatórias.
- Um guard impede utilizadores comuns de alterar os campos de uma notificação
  social, exceto `is_read`, ou de converter uma notificação comum numa social.

Não há backfill de notificações para mensagens anteriores à Fase 6. As mensagens,
contagens por ler e anexos existentes continuam a usar os dados originais. A
semântica temporal de `last_read_at` da Fase 4 é mantida.

## Ciclo de vida e segurança

A subscrição Realtime depende apenas da conta, não do cursor do histórico nem do
UUID da última mensagem. Cada tentativa de ligação tem uma geração; callbacks
atrasados de canais removidos são ignorados. Ao desmontar:

- Cancela polling, agrupamento de refresh e tentativa de reconexão.
- Remove listeners de visibilidade, foco, rede e autenticação.
- Remove o canal concreto com `removeChannel`, sem interferir em canais de outros
  módulos através de `removeAllChannels`.
- Ignora resultados de leitura e callbacks assíncronos depois do teardown.

Logout ou troca de conta desativa o canal antigo, cancela polling/reconexão e
provoca nova consulta autenticada. O cliente Supabase instalado já propaga
INITIAL_SESSION, SIGNED_IN e TOKEN_REFRESHED ao Realtime; não se duplicou esse
mecanismo nem se guardaram tokens no componente.

A tabela de sinais só concede SELECT à sessão autenticada, limitado à própria
linha. Sessões comuns não podem escrever revisões nem executar os helpers de
sinalização. Funções internas SECURITY DEFINER fixam `search_path = ''` e têm
EXECUTE revogado de PUBLIC/anon/authenticated. A RPC pública de leitura continua
a validar participação e pertença da mensagem à conversa.

## Ficheiros e aplicação futura

Migration: `supabase/migrations/20260909180000_social_module_phase6_realtime_notifications.sql`.
Requer as fases anteriores. Cria tabela de sinais, coluna/índice de notificações,
policies, triggers, atualização da RPC de leitura e inclusão aditiva da tabela
na publicação `supabase_realtime`. Não foi aplicada a nenhuma instância.

Os schemas declarativos públicos foram sincronizados. A gestão da publicação
fica na migration. Componentes alterados/criados:

- `components/social/conversation-updates.tsx`: Realtime, fallback e leitura.
- `components/social/message-controls.tsx`: conserva envio e soft delete; a lógica
  de atualização foi separada para o novo componente.
- `app/mensagens/page.tsx`: integração e painel de notificações sociais.
- `app/mensagens/[id]/page.tsx`: integração com identidade da sessão.

Nenhuma alteração aos sistemas de mensagens dos marketplaces, policies dos seus
buckets, chamadas ou Web Push. A tabela partilhada `notifications` recebe apenas
extensões sociais; as linhas sem `social_message_id` preservam as suas regras.

## Verificação realizada

- ESLint limitado aos quatro ficheiros TSX acima: passou, sem diagnósticos.
- TypeScript com configuração temporária limitada aos ficheiros alterados e
  dependências importadas: passou, sem diagnósticos.
- `git diff --check`: passou.
- Revisão manual do âmbito e da correspondência migration/schemas.

Não foram executados build, Docker, pgTAP, suites de testes, parser SQL, browser,
limpeza Storage, migrations, commit ou push. As verificações estáticas não
comprovam o funcionamento da publicação, RLS/Realtime, triggers ou concorrência
numa instância real.

Antes de aplicação futura, mediante autorização, validar localmente com três
sessões: envio de texto/anexo e rollback; notificações únicas; tentativa de
subscrição da linha de outro utilizador; acesso direto à conversa/notificação
alheia; soft delete; leitura em vários separadores; histórico antigo; perda e
recuperação de rede; publicação indisponível; repetição de eventos; troca de conta;
saída da página com reconexão pendente e manutenção do rascunho. Confirmar que as
caixas de mensagens dos marketplaces conservam o comportamento anterior.

## Referências consultadas

- Guia Next.js instalado: `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`.
- Código instalado: `node_modules/@supabase/supabase-js/src/SupabaseClient.ts`
  (propagação de tokens e remoção de canais).
- [Supabase Realtime: autorização e RLS](https://supabase.com/docs/guides/realtime/authorization).
- [Postgres Changes e limites de DELETE](https://supabase.com/docs/guides/realtime/postgres-changes).
