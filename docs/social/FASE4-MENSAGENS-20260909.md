# Módulo social — Fase 4: mensagens privadas genéricas

Data: 2026-09-09. Implementação local; migrations não aplicadas, sem push ou deploy.

## Funcionalidades

- `/mensagens`, acessível pelo perfil: início de conversa por username exato,
  caixa de entrada paginada (20 conversas), última mensagem e contagem por ler.
- Criação exclusivamente pela RPC `get_or_create_direct_conversation`, com o
  utilizador autenticado como um dos participantes; reutiliza o par existente.
- `/mensagens/[id]`: histórico de 50 mensagens por página com cursor composto
  por data/UUID, envio de texto até 5000 caracteres, um anexo até 5 MB e soft delete.
- JPG, PNG, WebP, PDF e MP4; download com URL assinada por 60 segundos.
- Atualização a cada 15 segundos enquanto o separador está visível. Leitura
  registada depois de a página recente chegar ao cliente, até à última mensagem
  apresentada. Consultar páginas antigas não marca mensagens recentes como lidas.
- Estados de carregamento, vazio, erro e submissão; texto preservado em falhas.
- Nenhuma tabela, ação ou página de mensagens dos marketplaces foi alterada.

## Base de dados e Storage

Aplicar futuramente, por ordem, Fases 2, 3 e a nova migration
`20260909140000_social_module_phase4_messages.sql`. Não foi aplicada neste trabalho.

- Trigger de atividade em `messages` atualiza `conversations.updated_at`.
- RPC de leitura altera apenas o participante autenticado, com avanço monotónico.
- RPC de envio usa SECURITY INVOKER/RLS e grava mensagem + `message_media`
  na mesma transação. O upload precede esta transação; em falha é tentada a
  remoção do objeto órfão. Uma falha de rede pode deixar um upload órfão;
  não foi implementada limpeza periódica nem política de retenção.
- Bucket privado `social-message-media`; chaves `conversation/user/uuid`.
  A policy de associação valida autor, participação, caminho, existência,
  tamanho e MIME dos metadados Storage. Não há inspeção do conteúdo binário.
- URLs assinadas já emitidas podem continuar válidas durante os seus 60 segundos
  após soft delete. O conteúdo e os objetos são retidos; a interface oculta-os.
- Funções e tabelas declarativas atualizadas. O bucket e as policies de Storage
  estão na migration, seguindo a organização existente (sem schemas/storage).
- Usa exclusivamente o cliente da sessão; não usa service role na aplicação.

## Verificação realizada

- ESLint apenas em `app/mensagens`, `components/social` e `lib/social`: passou.
- TypeScript com configuração temporária limitada ao módulo e dependências: passou.
- Revisão do diff; nenhuma execução de build, suíte geral, Docker ou pgTAP.

## Validação pendente (consultar o utilizador antes de executar)

`supabase/tests/database/social_messages.test.sql` contém 10 casos pgTAP
preparados, ainda não executados: envio autorizado, acesso alheio, limites de
texto, anexo inexistente, rollback atómico e limites da leitura.

Numa instância local descartável, aplicar as migrations e executar os testes
sociais das Fases 3/4. Validar também no browser com duas sessões: criação
concorrente do mesmo par, mensagens/anexos, contagem por ler, paginação com mais
 de 50 mensagens, atualização com separador oculto, falhas de upload e soft delete.
Uma terceira sessão deve ser incapaz de ler a conversa e de assinar os anexos.
Confirmar as policies Storage existentes nessa instância, incluindo eventuais
policies permissivas criadas fora das migrations. Validar que as caixas dos
marketplaces continuam a funcionar. Produção permanece por validar e aplicar.
