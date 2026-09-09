# Módulo social — Fase 5: Storage e anexos

**Data:** 2026-09-09. **Estado:** implementação local e verificações estáticas
concluídas. Migration não aplicada; sem commit, push, deploy, execução de limpeza
ou testes de integração. A validação funcional da base de dados continua pendente.

## Auditoria e correções

| Área | Fase 4 | Fase 5 |
| --- | --- | --- |
| Bucket | Criado com `ON CONFLICT DO NOTHING` | Atualiza apenas `social-message-media`, exigindo que já exista; privado, 5 MB e MIME explícitos |
| Caminhos | Verificava dois segmentos | Novos uploads exigem exatamente `conversation_id/user_id/uuid`, três UUIDs canónicos, sem extensão ou segmentos extra |
| Acesso | Policies permissivas iniciais | Helpers protegidos verificam participação e associações globais; guards restritivos isolam este bucket de outras policies permissivas |
| Órfãos | `NOT EXISTS` sujeito à visibilidade RLS | Consulta global protegida; referências invisíveis não são consideradas inexistentes |
| Download | URL assinada exposta na página | Link autenticado da aplicação; assinatura interna de 30 s, sem redirect ou token no browser |
| Soft delete | Interface ocultava anexo; metadados continuavam legíveis | RLS oculta metadados apagados/expirados; Storage recusa novas leituras; download revalida antes de responder |
| Compensação | Remoção direta após erro de envio | RPC reserva apenas objetos não associados, sob o mesmo lock da associação; recuperação posterior pelo operador |
| Retenção | Por definir | Órfãos 24 h; mensagens apagadas 30 dias; expiração explícita +24 h; ativos sem expiração são conservados |

Foram lidos `AGENTS.md`, os relatórios das Fases 3/4, a migration da Fase 4 e os
guias locais do Next.js relativos a Server Actions e Route Handlers. Foram
inspecionados o SDK Storage instalado e as policies de Storage versionadas.
Não foram consultadas credenciais nem policies de uma instância remota.

## Upload e MIME

Limite de **5 242 880 bytes**, inclusivo. MIME permitidos:
`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `video/mp4`.

A Server Action rejeita ficheiros vazios, MIME não permitido, excesso de tamanho e
assinaturas binárias básicas incompatíveis com o MIME declarado. Para MP4 aceita
um cabeçalho `ftyp` com marca MP4 reconhecida. Isto não é descodificação integral,
antivírus nem garantia contra ficheiros políglotas. Uploads diretos à API Storage
continuam sujeitos à RLS, ao limite do bucket e ao MIME declarado, mas não passam
pela inspeção binária da Server Action.

O envio usa `upsert: false`, UUID gerado no servidor e `cacheControl: "0"`.
A policy de associação confirma também a existência do objeto e a correspondência
de MIME/tamanho com os metadados Storage. A RPC transacional da Fase 4 permanece
compatível. Não se permite overwrite/update nem remoção direta deste bucket por
sessões comuns, mesmo que existam outras policies permissivas abrangentes.

## Downloads, URLs assinadas e soft delete

A página passa a apontar para `/mensagens/anexos/[id]`. A rota:

1. Exige autenticação e encontra o anexo sob RLS, com mensagem não apagada e anexo
   não expirado. UUIDs inválidos, anexos alheios e inexistentes não expõem dados.
2. Gera uma URL assinada de 30 segundos com o cliente da sessão, apenas no servidor.
3. Obtém o objeto sem cache nem redirects, com timeout e limite de leitura de 5 MB.
4. Volta a consultar o anexo depois da transferência e antes de entregar os bytes.
5. Responde como download `application/octet-stream`, com `nosniff`, CSP sandbox,
   `private, no-store`, exclusão de cache CDN e sem URL Storage no browser.

Não se alterou o service worker: a sua lista explícita de páginas públicas já
exclui estas rotas. A aplicação não usa service role nos uploads/downloads.

O trigger de soft delete fixa o instante no servidor e impede restaurar ou
reescrever `deleted_at` depois de definido. O conteúdo histórico e os metadados
não são apagados pela migration. Metadados de anexos de mensagens apagadas deixam
de ser visíveis pela API de utilizador.

**Limite real:** não é possível retirar uma cópia já descarregada nem cancelar
retroativamente bytes de um pedido já autorizado. URLs Storage que tenham sido
emitidas pela Fase 4, ou diretamente pela API por um participante autorizado,
também não são revogadas pela alteração de `deleted_at`. As URLs assinadas são
credenciais temporárias e podem envolver cache CDN. A nova interface deixa de
as distribuir; não se promete revogação universal de links Storage antigos.
Ver [downloads privados do Supabase](https://supabase.com/docs/guides/storage/serving/downloads)
e [comportamento de cache de URLs assinadas](https://supabase.com/docs/guides/storage/cdn/smart-cdn).

## Retenção e limpeza segura

Política local adotada, sem execução automática neste trabalho:

- **Anexo ativo sem `expires_at`:** conservar indefinidamente; sem expiração
  retroativa atribuída aos anexos existentes.
- **Mensagem apagada:** objeto elegível 30 dias após `deleted_at`.
- **Expiração explícita interna:** acesso termina em `expires_at`; objeto elegível
  24 horas depois. Sessões comuns não podem escolher a expiração no INSERT.
- **Órfão:** objeto sem qualquer referência `supabase` em `message_media`, com
  pelo menos 24 horas de idade. A varredura não depende da visibilidade do utilizador.
- **Upload abandonado explicitamente:** pode ser reservado logo após a falha,
  desde que exista e continue sem referências. Uma resposta de envio perdida
  não faz apagar um ficheiro que entretanto tenha sido associado.
- **Chave com várias referências:** conservar enquanto qualquer referência
  ainda não cumprir a sua condição de retenção.

`social_media_cleanup_jobs` é uma fila privada e um registo permanente de chaves
retiradas de uso. Apenas o serviço interno acede diretamente à tabela. A RPC de
reserva e o trigger de associação usam o mesmo advisory lock por chave; a reserva
repete a consulta das referências depois de obter o lock. Uma chave reservada
não pode ser associada, lida nem reutilizada por novos uploads. Updates de
metadados também passam pelo guard. O worker só elimina objetos previamente
reservados. O serviço interno é uma fronteira de confiança: não se deve contornar
esta fila com operações administrativas arbitrárias.

A eliminação física usa exclusivamente a **API Storage**, nunca `DELETE FROM
storage.objects`. É o procedimento indicado na [documentação de remoção do
Supabase](https://supabase.com/docs/guides/storage/management/delete-objects).
Mensagens e `message_media` ficam como registo histórico, invisíveis quando
apagados/expirados; os tombstones não são removidos.

### Operador preparado, não executado

`scripts/social/cleanup-message-media.mjs`:

- Aceita apenas uma URL Supabase local em loopback, sem redirects. Não carrega
  `.env.local`, não procura credenciais e não admite uma instância de produção.
- Recebe `SOCIAL_STORAGE_URL` e `SOCIAL_STORAGE_SERVICE_ROLE_KEY` explicitamente.
- Sem argumentos, simula; `--apply` reserva e remove até 100 objetos por execução.
- Reutiliza jobs pendentes após interrupções. Só marca conclusão após sucesso da
  API; falhas ficam pendentes, incrementam tentativas e produzem exit code 1.
- Não escreve chaves de objetos, UUIDs de utilizadores, tokens ou URLs nos logs.
- Não foi criado cron nem ativado qualquer agendamento. A limpeza física exige
  executar este operador na instância local; uma futura operação remota necessita
  de revisão e autorização próprias.

Exemplo **apenas para uma instância local já preparada**, não executado:

```bash
# Fornecer as duas variáveis SOCIAL_STORAGE_* pelo ambiente, sem as guardar no repo.
node scripts/social/cleanup-message-media.mjs
# Só após rever a simulação e autorizar a remoção local:
node scripts/social/cleanup-message-media.mjs --apply
```

Se a compensação ou o processo falharem, podem existir objetos órfãos até à
próxima execução. Não se afirma que os ficheiros desaparecem imediatamente.

## Compatibilidade e âmbito

Migration nova: `20260909160000_social_module_phase5_storage.sql`, após a Fase 4.
É transacional e não duplica o bucket. Não modifica mensagens/anexos existentes
nem impõe constraints retroativas sobre os seus caminhos. A leitura de anexos
existentes usa associação e participação, preservando caminhos antigos; a
validação dos três UUIDs aplica-se aos novos uploads/associações. Objetos antigos
acima de 5 MB ficam conservados, mas a nova rota não os entrega. Providers externos
continuam sem implementação de download, tal como na Fase 4.

Os schemas declarativos públicos foram sincronizados. Configuração e policies de
Storage permanecem na migration, seguindo a organização existente. Os guards
restritivos são neutros para todos os outros buckets. Nenhum ficheiro ou tabela
de mensagens dos marketplaces foi alterado.

## Verificações realizadas e limites

- ESLint apenas nas seis unidades JS/TS alteradas/criadas: passou, sem diagnósticos.
- TypeScript com configuração temporária limitada aos ficheiros TS alterados e
  respetivas dependências: passou, sem diagnósticos.
- `node --check` no operador: passou; não executa o script nem chama serviços.
- Parser PostgreSQL `pglast`: 49 instruções SQL e quatro funções PL/pgSQL aceites
  sintaticamente, sem ligação a uma base de dados. Usou-se a API de parsing bruta
  para PL/pgSQL, pois o wrapper JSON do parser falhou ao descodificar um trigger.
- `git diff --check`: passou.

Não foram executados build, Vitest, pgTAP, browser/E2E, Docker, resets, migrations,
simulações contra Storage ou limpeza real. Parsing não valida grants, existência
de relações, execução de RLS, comportamento da API Storage nem concorrência real.

Antes de aplicação futura, mediante consulta ao utilizador, validar numa instância
local: três sessões (autor, destinatário e intruso); uploads REST diretos; MIME e
limites; caminhos inválidos; tentativa de overwrite; assinatura/consulta após
soft delete; anexos expirados; URL antiga; resposta perdida durante envio;
associação concorrente com limpeza; duas referências à mesma chave; interrupção
do worker; repetição de jobs e leitura de mensagens/anexos preexistentes. Rever
policies Storage externas às migrations, papéis internos usados pela API e
compatibilidade com as caixas de mensagens dos marketplaces.
