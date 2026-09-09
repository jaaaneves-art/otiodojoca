# FASE 0 — Auditoria ao Módulo Social do OTJ

**Data:** 2026-08-29, 22:06 (Europe/Lisbon)
**Âmbito:** só leitura. Nenhum ficheiro do projeto foi alterado, nenhuma migration corrida, nenhuma dependência instalada.
**Fonte:** código real em `/home/berze/Nextcloud/Projectos/otiodojoca` (ligado a esta sessão) — não suposições.

---

## 1. Tabela de entidades — existe / onde / reutilizável?

| Entidade necessária | Existe? | Onde | Reutilizável tal como está? |
|---|---|---|---|
| Perfil de utilizador | Sim | `public.profiles` | Sim — já tem `deleted_at` (soft delete), policy de leitura pública, `role`, `is_admin` |
| Autenticação / sessão | Sim | Supabase Auth + `proxy.ts` → `lib/supabase/middleware.ts` | Sim — proteção de rotas ativa em produção (Next 16 renomeou `middleware.ts` para `proxy.ts`; confirmado que está a chamar `updateSession()`) |
| 2FA / MFA | Sim (custom) | `profiles.two_factor_enabled`, `recovery_codes`, `user_sessions`, `app/(auth)/mfa/{setup,verify}` | Sim — enrollment confirmado a funcionar (testado 29/08) |
| Conversa 1:1 | Sim (parcial) | `marketplace_conversations` | **Parcialmente** — já tem a deduplicação exata da secção 69 (`least/greatest` unique quando `ad_id is null`), `module` (texto) e `ad_id` opcional desde 28/08. Mas os nomes de coluna (`buyer_id`/`seller_id`) e o grant público de `anon` (ver Riscos) são de marketplace, não de mensagens genéricas |
| Mensagens de texto | Sim | `marketplace_messages` | Parcial — só `content` (texto), sem `message_type`, sem `deleted_at` |
| Anexos de mensagem | Sim | `marketplace_message_attachments` | Parcial — guarda `storage_path`/`file_name`/`file_type`, mas sem metadados de vídeo (duração, thumbnail, dimensões, tamanho) pedidos na secção 13 |
| Notificações | Sim | `public.notifications` | Parcial — `type` tem CHECK restrito a `reply/mention/like` (só fórum); alargar o CHECK chega, não é preciso tabela nova |
| Feed / Posts / Comentários | Sim (forum, não feed) | `posts`, `threads` (fórum) | **Não diretamente** — `posts` pertence sempre a uma `thread`, que pertence sempre a uma `category_id` de fórum. Padrões a copiar (RLS pública para leitura, trigger de notificação `notify_thread_author()`, `search_vector` gerado), mas não são a mesma tabela |
| Grupos / membros de grupo | Não | — | Trabalho novo |
| Participantes de conversa (grupo) | Não | — | Trabalho novo — o modelo atual só tem `buyer_id`/`seller_id` (2 pessoas fixas), não serve para grupo |
| Chamadas / LiveKit | Não | — | Trabalho novo |
| Reações | Não | — | Trabalho novo (o `notifications.type` já prevê `'like'`, mas não há tabela de reações) |
| Bloqueios entre utilizadores | Não | — | Trabalho novo |

## 2. Tabela de lacunas — o que falta mesmo construir

| Lacuna | Prioridade (para o MVP da secção 54) |
|---|---|
| `conversation_participants` / generalizar conversas para N pessoas (grupo) | Alta |
| `groups` + `group_members` (com papéis owner/admin/moderator/member) | Alta |
| Alargar `notifications.type` (CHECK) para incluir mensagem/chamada/convite de grupo | Alta, mas barata (1 migration) |
| `message_type` em `marketplace_messages` (ou tabela de mensagens genérica nova) + metadados de vídeo | Alta |
| Tabelas de chamadas (rooms/participantes) + integração LiveKit (token server-side) | Média — depende da decisão da secção 10 |
| Feed genérico (posts/comentários/reações fora do fórum) | Média — pode esperar pela fase 9 do roteiro |
| Bloqueios (`user_blocks`) | Baixa para o MVP, mas RLS de mensagens/chamadas já deveria prever o gancho |

## 3. Tabela de riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| ~~Enrollment do MFA ficou a meio~~ — **RESOLVIDO** | Confirmado pelo Yos em 29/08: testado hoje, funciona | — |
| `marketplace_conversations`/`marketplace_messages` têm grants amplos a `anon` (`grant ... to "anon"` nalgumas tabelas, com `revoke` seletivo de colunas) | Se o módulo social generalizar estas tabelas sem rever os grants, pode abrir mensagens privadas a utilizadores anónimos por descuido | Rever grants coluna a coluna antes de estender estas tabelas para uso genérico, não só confiar na RLS |
| Nomes de coluna (`buyer_id`/`seller_id`) não fazem sentido fora do marketplace | Reaproveitar a tabela tal como está para mensagens genéricas do módulo social fica confuso e propenso a erro (ex.: quem é "buyer" numa conversa entre dois vizinhos no fórum?) | Decidir explicitamente em ADR: generalizar esta tabela (rename/migration) vs. criar uma tabela de conversas genérica nova que reutiliza só o *padrão* de deduplicação, não a tabela |
| Buckets de Storage de produção não estão declarados no `supabase/config.toml` (só valores de exemplo comentados) | Não dá para confirmar só pelo código que buckets/policies existem para `marketplace_message_attachments` em produção | Confirmar no Supabase Dashboard (Storage) antes de desenhar upload de vídeo |
| `AUDITORIA-REDE-SOCIAL-MFA-20260824.md` está desatualizada nalguns pontos (já não é verdade que falte `middleware.ts` na raiz, nem que falte `app/(auth)/mfa/`) | Decisões tomadas com base só nesse documento antigo estariam erradas | Este documento substitui-o nesses dois pontos; manter os dois, não apagar o antigo (histórico) |

## 4. ADRs curtos

```text
ADR — Storage para o módulo social
Contexto: precisa de guardar imagens/vídeo de mensagens e do feed.
`marketplace_message_attachments` já guarda anexos (storage_path/file_name/
file_type), mas os buckets reais de produção não são visíveis no código
(config.toml só tem exemplos comentados).
Decisão: confirmar no Supabase Dashboard os buckets e policies já em uso
antes de desenhar o upload de vídeo do módulo social. Não migrar Storage
existente. Seguir Supabase Storage por omissão (secção 76 do estudo
anterior); só considerar R2 se o cálculo de GB/mês do feed justificar.
Consequências: sem essa confirmação, qualquer estimativa de custo de
Storage (secção 33/75) fica sem base real.
```

```text
ADR — LiveKit para chamadas
Contexto: não existe nenhuma infraestrutura de chamadas no OTJ hoje.
Decisão: usar LiveKit com token gerado server-side (Edge Function),
SDK Web (JS) no MVP — confirmado maduro e "first-class" (ver estudo
Flutter vs PWA, 29/08). Sem WebRTC puro.
Consequências: nenhuma dependência nova no cliente além do SDK JS;
secret do LiveKit nunca sai do servidor.
```

```text
ADR — Notificações de chamada/mensagem com app fechada
Contexto: Realtime só entrega com a app aberta; PWA no iOS não tem
VoIP push/CallKit (ver estudo Flutter vs PWA, secção 4).
Decisão: MVP usa só Realtime in-app (Opção A da secção 68), com a
limitação declarada na UI. Web Push como reforço em Android/desktop,
não como requisito do MVP.
Consequências: chamada recebida com a app fechada no iPhone não toca —
aceite e documentado, não escondido do utilizador.
```

---

## Resultado

**EVOLUI.**

MFA confirmado a funcionar (testado pelo Yos em 29/08) — risco fechado. Fica só um ponto em aberto: os buckets de Storage em produção não são visíveis no código. Mas isso não bloqueia a Fase 1 (arquitetura) — só é preciso mesmo antes de desenhar o upload de vídeo, na Fase 5 (Media). Pode ficar registado e revisitado nessa altura, com o Supabase Dashboard ou, se o Yos preferir, ligando o conector MCP do Supabase para eu conseguir consultar isto diretamente em vez de pedir para ele ir ver.

Este documento fica só como ficheiro entregue (não foi escrito dentro do repositório). Se quiseres, posso gravá-lo em `docs/auditoria-social.md` dentro do próprio projeto, como o teu prompt mestre pede na secção 77 — mas prefiro confirmar contigo antes de escrever dentro do repositório real.
