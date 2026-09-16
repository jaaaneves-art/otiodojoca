# Pendentes — StandGo e Eventos & Festas

## Bloqueios reais

### 1. UI profissional StandGo

A arquitetura SQL está pronta, mas faltam o diretório profissional StandGo, pesquisa, perfil público e integração completa dos campos de aluguer com motorista nos formulários:

- `app/viaturas/novo/page.tsx`
- `app/viaturas/editar/[id]/page.tsx`

Os tipos/configuração já existem em `lib/viaturas/ad-types.ts`.

### 2. Build Next global

O build falha no prerender porque duas páginas resolvem para `/`:

- `app/page.tsx`
- `app/(comer)/page.tsx`

O grupo `(comer)` não altera o URL. Corrigir preservando `/comer`. Esta alteração é separada do âmbito StandGo/Eventos & Festas.

### 3. Migration de marketplace

`supabase/migrations/20260913232000_marketplace_ad_completo_rpc.sql` ficou fora do commit. O histórico de migrations e as funções locais precisam de reconciliação antes de qualquer aplicação de migrations de marketplace.

## Antes de aplicar migrations

1. Fazer replay completo em staging.
2. Confirmar a ordem:
   - `20260915190000_entidades_empresas_transversal_v1.sql`
   - `20260915193000_standgo_empresas_v1.sql`
   - `20260915200000_entidades_diaspora_privacidade_v1.sql`
   - `20260915203000_eventos_festas_profissionais_v1.sql`
3. Validar FKs, RLS, grants, triggers e dependências.
4. Rever consumidores de `entidades.freguesia_id` que assumam `NOT NULL`.
5. Rever selects integrais de `entidade_empresas`.
6. Definir backfill de entidades existentes sem apagar dados.
7. Confirmar moderação e verificação profissional.
8. Não aplicar diretamente em produção.

## Fora do âmbito deste trabalho

Não alterar sem revisão própria:

- `REGISTO-SESSOES-IA.md`
- páginas marketplace de Gran Bazar, Imóveis, Mercado da Terra e Viaturas
- `docs/pendentes/` e `docs/planos/` preexistentes
- `outputs/`
- `tests/standgo/`
- `20260913232000_marketplace_ad_completo_rpc.sql`

## Handoff para outra IA

Confirma antes de continuar:

1. Que compreendeste o commit `c81e63d` e que ele já foi enviado para a branch remota.
2. Que vais manter marketplace e REGISTO fora deste âmbito.
3. Que vais tratar a UI StandGo e a rota `/` duplicada como tarefas separadas.
4. Que não vais aplicar migrations sem replay e validação em staging.
5. Que não vais fazer reset destrutivo.

Depois indica o próximo passo técnico concreto e executa apenas esse passo.
