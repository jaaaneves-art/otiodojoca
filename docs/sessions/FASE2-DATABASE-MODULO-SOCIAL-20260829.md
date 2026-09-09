# FASE 2 — Database (módulo social) — 2026-08-29 22:28 (Lisboa) — CONCLUÍDA 23:58

## Resultado final: EVOLUI

`npx supabase db push` aplicado com sucesso à produção às 23:58. A migration `20260829223000_social_module_v1.sql` criou, em produção:

- Tabelas: `groups`, `group_members`, `conversations`, `conversation_participants`, `messages`, `message_media`, `call_rooms`, `call_participants`.
- Funções: `is_conversation_participant`, `is_group_member`, `get_or_create_direct_conversation`, `handle_new_group`, `sync_group_conversation_participants`.
- Triggers: `on_group_created` (groups), `on_group_members_change` (group_members), `conversations_updated_at` (conversations).
- RLS + policies em todas as tabelas novas.
- `notifications.type` alargado para incluir `message`, `call`, `group_invite`.

Verificado localmente primeiro com `supabase db reset` (zero erros) antes de `db push` — nenhuma surpresa em produção.

## Incidentes encontrados e resolvidos durante esta fase (resumo — detalhe nos documentos ligados)

1. **Histórico de migrations incompleto** — ~90 tabelas nunca tinham migration própria (criadas antes do projeto adotar migrations). Resolvido arquivando as 25 migrations antigas (`supabase/migrations_archive/`) e gerando uma baseline única via `supabase db pull` (`20260829220537_remote_schema.sql`).
2. **"EXCEEDING USAGE LIMITS" no Supabase** — base de dados a 129% do limite Free (645 MB de 500 MB), causada por `netuno_log` (framework legada, sem uso confirmado no código). Resolvido com `TRUNCATE`; base de dados real confirmada em 306 MB. Detalhe em `FASE1-ARQUITETURA-MODULO-SOCIAL-20260829.md`.
3. **`db diff` propôs apagar toda a base de dados** — causa: `supabase/config.toml` tem `schema_paths = []` (fluxo declarativo nunca esteve realmente configurado). O ficheiro destrutivo gerado (`20260829221352_social_module_v1.sql`) foi identificado e arquivado antes de qualquer `db push` — nunca chegou a tocar na produção. Migration final da Fase 2 escrita à mão em vez de gerada por `db diff`. Detalhe em `docs/pendentes/DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md` (não urgente).
4. **Colisão de nome de índice** — `idx_messages_conversation` já existia (tabela `marketplace_messages`); renomeado para `idx_social_messages_conversation` na nova tabela `messages`.

## Pendentes abertos (não bloqueiam a Fase 3, registados para retomar)

- `docs/pendentes/NETUNO-CODIGOS-POSTAIS-20260829.md` — investigar ligação Netuno ↔ tabelas de códigos postais, resolver duplicações (`arteria`, `codigo_postal`, `codigo_postal_arteria`).
- `docs/pendentes/DB-DIFF-DECLARATIVO-NAO-CONFIGURADO-20260829.md` — configurar `schema_paths` corretamente (baixa prioridade).
- `docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md` — usar o AutoNex para reforçar o StandGo + escolher novo nome para o módulo.
- Política de retenção de media (secção 17 do prompt mestre) — ainda por decidir, referenciado em `message_media.expires_at`.

## Antes de continuar para a Fase 3

Recomendo um commit git a fechar este estado (migration aplicada, `migrations_archive/`, `messages.sql` corrigido) antes de terminar por hoje.
