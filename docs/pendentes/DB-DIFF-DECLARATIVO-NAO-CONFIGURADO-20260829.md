# Pendente — `supabase db diff` não está realmente configurado para o fluxo declarativo — 29/08/2026 23:35

**Prioridade: baixa, não bloqueia nada. Registar para resolver com calma, não às pressas à noite.**

## O que aconteceu

Ao gerar a migration da Fase 2 com `npx supabase db diff -f social_module_v1`, o resultado propôs **apagar literalmente todas as tabelas da base de dados** (DROP TABLE em todas as ~90 tabelas, incluindo `profiles`, `marketplace_conversations`, etc.). **Nada disto foi aplicado** — o `db diff` só escreve um ficheiro local, nunca toca na produção. Identifiquei a causa antes de o Yos correr `db push` com este ficheiro.

## Causa raiz

`supabase/config.toml`:
```toml
[db.migrations]
schema_paths = []
```

Está vazio. Isto significa que o `db diff` nunca teve, desde sempre, uma lista de ficheiros declarativos (`supabase/schemas/...`) para usar como "estado desejado" — por isso comparou o estado reconstruído a partir das migrations contra um alvo vazio, e concluiu que era preciso apagar tudo para bater certo com "nada".

Isto explica também porque é que os ~90 ficheiros em `supabase/schemas/` (tabelas antigas) nunca estiveram realmente a alimentar nenhuma migration gerada — as 25 migrations desde 20/08 foram escritas à mão, não geradas por `db diff`. Os ficheiros em `schemas/` sempre foram só documentação/espelho manual do schema real, nunca a fonte de verdade ativa.

## Porque não se corrige já

Ligar `schema_paths` a `./schemas/public/**/*.sql` não é trivial neste projeto: os ficheiros são aplicados por ordem alfabética dentro de cada pasta, e várias tabelas têm nomes de "tabela filha" que ordenam alfabeticamente ANTES da tabela-mãe de quem dependem por FK — por exemplo `calendar_event_participants.sql` vem antes de `calendar_events.sql` (o `_` ordena antes de `s`), mas a primeira tem FK para a segunda. O mesmo problema afeta várias das tabelas novas do módulo social (`call_participants` vs `call_rooms`, `conversation_participants` vs `conversations`, `group_members` vs `groups`, `message_media` vs `messages`).

Ativar isto às cegas geraria os mesmos erros de ordem de criação que já vimos com as migrations antigas — só que ao nível de ~90 ficheiros de uma vez.

## Como resolver, quando houver tempo

1. Confirmar se realmente se quer adotar o fluxo declarativo (`db diff` a gerar migrations automaticamente) ou continuar a escrever migrations à mão — ambos são válidos em Supabase, mas exigem disciplina diferente.
2. Se for para adotar: os ficheiros em `supabase/schemas/public/tables/*.sql` precisam de um esquema de nomeação ou de configuração explícita (`schema_paths` com uma lista ordenada de ficheiros individuais, não um único glob) que garanta que tabelas-mãe são sempre processadas antes das tabelas-filha. Isto é um trabalho de reorganização à parte, não urgente.
3. Até lá: migrations continuam a ser escritas à mão quando necessário (como a da Fase 2 do módulo social, `20260829223000_social_module_v1.sql`), o que já é seguro e funciona.

## Contexto relacionado

- `claude/FASE2-DATABASE-MODULO-SOCIAL-20260829.md`
- `docs/pendentes/NETUNO-CODIGOS-POSTAIS-20260829.md`
