# Auditoria — Fase 1 do FENCE "Sistema Unificado de Contas, Entidades, Validação e Participação"

**Data:** 2026-09-12
**Âmbito:** Auditoria de leitura (sem alterações de código), conforme exigido pela secção 52 do documento `Sistema Unificado de Contas Entidades Validação e Participação do OTJ.md`.
**Método:** Inspeção direta do repositório real (`~/Nextcloud/Projectos/otiodojoca`, branch `main`), do dump `supabase/migrations/20260829220537_remote_schema.sql` e das migrations posteriores, e da documentação já existente em `docs/`.

---

## 1. Resultado desta fase

**EVOLUI** — com um aviso importante: o OTJ já tem uma parte substancial do que o FENCE pede, mas construída em **três sistemas paralelos e não unificados**. A Fase 2 (modelo de dados) não deve começar do zero; deve **unificar o que já existe**, que é precisamente o princípio central do próprio FENCE (secções 2 e 38 — proibido criar arquiteturas paralelas, proibido duplicar).

---

## 2. Autenticação central (secções 1–2 do FENCE)

Existe **uma única autenticação**, via Supabase Auth (`auth.users`), com sessão gerida por `@supabase/ssr`:

- `lib/supabase/server.ts`, `lib/supabase/client.ts` — clientes Supabase (server/browser).
- `lib/supabase/middleware.ts` (9,4 KB) — `updateSession()`, chamado pelo `proxy.ts` (middleware do Next) em todas as rotas exceto assets estáticos. Gere renovação/expiração de sessão e, como se confirma abaixo, também a política de MFA obrigatório.
- `lib/supabase/admin.ts` — cliente com service role, usado por operações privilegiadas (ex.: auditoria).
- `lib/auth/actions.ts`, `lib/auth/login.ts`, `lib/auth/username-check.ts`, `lib/auth/safe-next.ts` — ações de login, criação de conta, validação de username, redireciono seguro pós-login.
- Rotas: `app/(auth)/login`, `/registo`, `/forgot-password`, `/reset-password`, `/mfa/setup`, `/mfa/verify`.

**Não há uma segunda autenticação.** Todos os módulos (fórum, marketplace, escutismo, espetáculos, social) usam `auth.users` + `profiles`. Isto já respeita a regra central do FENCE.

### 2FA / MFA (secção 5.2 e 8)

Já implementado e **já com a regra exata que o FENCE pede**:

- `profiles.two_factor_enabled` e `profiles.mfa_setup_dismissed_at`.
- `lib/auth/actions.ts` (`dispensarConfiguracaoMfa`, `desativarMfa`): 2FA é **opcional para "user"**, mas **obrigatório para "moderator"/"admin"** — a própria regra decidida está documentada no código ("Esta conta é obrigada a ter a verificação em duas etapas ativa.").
- A imposição real acontece no middleware (`lib/supabase/middleware.ts`), não só na interface — bate certo com a secção 36 do FENCE ("a interface não deve ser o mecanismo de segurança").

Ou seja: a secção 5.2 e parte da secção 40 do FENCE **já estão implementadas**, não precisam de ser reconstruídas.

---

## 3. O problema central: três sistemas de "conta ≠ entidade", não um

O FENCE pede **um** modelo (`ACCOUNT → USER / ENTITY → MEMBERSHIP → ROLE → PERMISSION → VALIDATION`). O código atual tem **três** implementações independentes desse mesmo conceito:

### 3.1 `profiles.role` — papel único, global, plataforma inteira

```sql
create type "public"."user_role" as enum ('user', 'moderator', 'admin');
alter table "public"."profiles" add column "role" public.user_role not null default 'user';
```

Um único enum, sem escopo por entidade. É usado para: gate de MFA obrigatório, moderação de fórum/social (RLS com `role = ANY (ARRAY['moderator','admin'])`), e administração geral (`/admin/*`). **Isto não é o que o FENCE descreve em "ROLES" (secção 35)** — lá, um "OWNER" de uma associação não deve ser o mesmo conceito que um "admin" da plataforma. Hoje não há essa distinção: não existe nenhuma tabela de role *por entidade*.

### 3.2 Módulo Freguesia — `entidades` / `entidade_relacoes` / `entidade_pedidos` / `categorias_entidade`

Este é o sistema que mais se aproxima do modelo `ENTITY` do FENCE:

- `entidades`: uma linha por organização/instituição/comércio, com `categoria_id` (FK para `categorias_entidade` — catálogo extensível, exatamente como a secção 4 do FENCE pede), `freguesia_id`, e um campo `estado` (`rascunho → pendente → validado → publicado → desactualizado → arquivado`) que já é um ciclo de vida de validação.
- `entidade_relacoes`: relação origem→destino com `tipo_relacao` (`presidente_de`, `membro_de`, `parceiro_de`, `filial_de`, `subsecao_de`, etc.) — isto é literalmente o mecanismo que a secção 18 do FENCE pede para modelar Paróquia→IPSS/Comissão Fabriqueira, só que hoje **é usado apenas no contexto do módulo Freguesia**, não como mecanismo central de membership.
- `entidade_pedidos`: fila de pedidos de registo de entidade, com `tipo_entidade` limitado por `CHECK` a `('municipio', 'freguesia', 'organismo_publico', 'outro', 'stand_automovel')` e `estado` (`pendente/aprovado/rejeitado`) — **validação manual única para todos os tipos**, sem distinguir SSO institucional, confirmação da Junta com prazo de 30 dias, ou confirmação por pares. Isto é exatamente a lacuna que as secções 10–19 e 30–32 do FENCE identificam como necessária.
- Nota: a rota `/parceiros/pedido/empregador` existe no frontend, mas `empregador` **não consta** no `CHECK` de `tipo_entidade` em `entidade_pedidos` — a confirmar na Fase 2 se os pedidos de empregador seguem este fluxo ou um caminho diferente (o módulo Empregos parece ter o seu próprio sistema, ver 3.4).

### 3.3 Módulo Escutismo — sistema paralelo completo e autossuficiente

`supabase/migrations/20260906160000_escutismo_schema_v1.sql` cria uma **arquitetura de conta/entidade/role/membership/validação inteiramente própria**, sem qualquer ligação às tabelas `entidades`/`entidade_relacoes`:

- `escutismo_associacoes`, `escutismo_agrupamentos` (equivalente ao `SCOUT_GROUP` do FENCE, com `estado` pendente/ativo/suspenso).
- `escutismo_papeis` — role **por agrupamento** (`nacional_cne` vs `responsavel`), já com escopo — isto é mais avançado do que `profiles.role` neste aspeto específico.
- `escutismo_membros` — membership de escuteiros (crianças/jovens), com proteção de menores por desenho (consentimento do encarregado, RGPD art. 8), algo que o FENCE nem chega a prever explicitamente.
- `escutismo_pedidos_adesao` + `escutismo_pedido_aprovacoes` — **exatamente** o mecanismo de "confirmação por pares" que a secção 15 do FENCE pede, mas implementado apenas para adesão de membros a um agrupamento, não para validar a legitimidade de um novo agrupamento perante outros agrupamentos (que é o que a secção 15/16 do FENCE descreve).
- `escutismo_auditoria` — auditoria própria, separada da `audit_log` central.

Isto é o exemplo mais claro do que o FENCE proíbe nas secções 2 e 38: um módulo com a sua própria mini-arquitetura de conta/entidade/role/validação, correndo em paralelo ao resto.

### 3.4 Módulo Social — `groups` / `group_invites`

Existe ainda um terceiro conceito de agrupamento de pessoas (Grupos, `/grupos`), com a sua própria tabela `group_invites` (migration `20260909200000_social_module_phase7_groups.sql`). Não foi possível confirmar nesta passagem se partilha alguma tabela de membership com os sistemas acima (ficheiro `social_module_v1.sql` ainda não foi lido em detalhe — ver secção 6, pendências).

### Resumo do problema

| Conceito FENCE | `profiles.role` | Freguesia (`entidades`) | Escutismo | Social (`groups`) |
|---|---|---|---|---|
| Entity | não tem | sim (`entidades`) | sim (`escutismo_agrupamentos`) | sim (`groups`, a confirmar) |
| Role com escopo | não (global) | não (só `entidade_relacoes.tipo_relacao`, não é role de acesso) | sim (`escutismo_papeis`) | por confirmar |
| Membership | não | não (usa `entidade_relacoes` de forma genérica) | sim (`escutismo_membros`) | por confirmar |
| Validation method diferenciado | n/a | não (só admin manual) | sim (peer confirmation) | por confirmar |
| Auditoria | `audit_log` central | `freguesia_audit` | `escutismo_auditoria` | por confirmar |

---

## 4. RLS e segurança

- **99 políticas `CREATE POLICY`** só no dump base (`remote_schema.sql`), mais as adicionadas nas migrations seguintes (`social_module_phase3_rls`, `freguesia_rls_categorias_horarios`, `sprint10_seguranca`, `correcao_p0_p1_autoria_e_leiloes` de ontem). A prática de aplicar RLS é consistente e já madura — a secção 36 do FENCE ("não confiar só na interface") já é seguida.
- `next.config.js` aplica CSP/HSTS/Permissions-Policy globais (adicionado ontem, 2026-09-11, referenciando uma auditoria independente).
- Auditoria central (`audit_log`, `lib/audit/log.ts`) é escrita **só por service role** (a policy de INSERT por utilizador comum foi removida deliberadamente) — boa prática, alinhada com a secção 33 do FENCE.
- `user_sessions`, `recovery_codes`, `reserved_usernames`, `username_history` já existem — infraestrutura de sessão e recuperação de conta já é razoavelmente completa.
- Tabelas `netuno_*` (netuno_app, netuno_user, netuno_group, netuno_auth_jwt_token, etc.) existem no schema mas não têm qualquer referência no código-fonte inspecionado — parecem resíduo de uma plataforma/ferramenta anterior (Netuno, um low-code builder). **A confirmar na Fase 2 se podem ser removidas** (a secção 61/62 do FENCE proíbe eliminar dados sem necessidade comprovada e autorização — isto fica como pergunta em aberto, não como ação).

---

## 5. Instituições públicas / SSO (secções 6–8 do FENCE)

**Não encontrada** qualquer implementação de SSO institucional nem de tabela de "domínios institucionais reconhecidos" (`institution_domain`). O fluxo atual para município/freguesia/organismo público é o mesmo formulário genérico de `entidade_pedidos` com aprovação manual por admin — a secção 6.1 e a secção 7 do FENCE descrevem algo que ainda não existe no projeto. Isto é trabalho novo de raiz, não uma unificação.

---

## 6. Pendências desta auditoria (não bloqueiam o "EVOLUI", mas ficam por confirmar na Fase 2)

- Estrutura completa de `groups`/membership social (só vi `group_invites`; falta ler `20260829223000_social_module_v1.sql` e as fases 3–6 do social).
- Se `empregador` em `/parceiros/pedido/empregador` usa `entidade_pedidos` ou uma tabela própria do módulo Empregos (`docs/EMPREGOS.md` tem 44 KB — sinal de que o módulo é grande e pode ter o seu próprio sistema de "empresa"/"candidato").
- Papel exato das tabelas `netuno_*` (confirmar se são mortas ou se algo ainda depende delas antes de qualquer remoção).
- Conteúdo de `docs/PARCEIROS-ENTRADA.md` e da pasta `docs/freguesia/` (vários documentos de auditoria e decisão já existem — `DECISAO-000-PONTE-VERTICAIS.md`, `MODULO-FREGUESIA-OTJ-V2/V3.md` — que provavelmente já documentam parte destas escolhas e valem a pena ler antes da Fase 2, para não repetir decisões já tomadas).
- `docs/Whitepaper/` já tem um "Livro Branco do OTJ" (v2.0, 15 KB) — o FENCE (secção 0) diz destinar-se a ser integrado aí; convém confirmar contigo se este FENCE deve ser anexado a esse Livro Branco existente.

---

## 6.1 Adenda (2026-09-12) — confirmação do proprietário sobre menores no escutismo

Confirmado pelo Yos: os papéis de responsabilidade no escutismo (`escutismo_papeis`: `responsavel`, `nacional_cne`) **são sempre atribuídos a contas de adultos**, nunca aos escuteiros menores registados em `escutismo_membros`. Isto reduz o risco da unificação:

- `escutismo_agrupamentos` pode ser tratado como uma `ENTITY` do tipo `SCOUT_GROUP` no sistema novo.
- `escutismo_papeis` (sempre adultos) pode migrar para o `MEMBERSHIP` + `ROLE` genérico do FENCE sem qualquer risco de tocar em dados de menores.
- `escutismo_membros` (os escuteiros, incluindo menores, com consentimento do encarregado de educação) **fica exatamente como está, sem ser tocada**.
- `escutismo_pedidos_adesao` / `escutismo_pedido_aprovacoes` (confirmação por pares para adesão de um escuteiro ao agrupamento) também ficam como estão — são sobre adesão de membros, não sobre validação do agrupamento em si.

Isto torna a "opção 3 (híbrido)" da secção 7 mais concreta e de baixo risco especificamente para o módulo Escutismo: só a camada de liderança/administração é unificada; o registo dos próprios escuteiros não é tocado.

## 7. Recomendação para a Fase 2

Não criar tabelas novas de raiz (`accounts`, `memberships`, `roles` genéricas) sem antes decidir explicitamente uma destas três estratégias, porque têm custos e riscos diferentes:

1. **Unificar por cima**: criar `memberships`/`roles`/`validation` genéricas novas, e migrar gradualmente `escutismo_*` e `entidade_relacoes` para as usarem como camada de compatibilidade — mais trabalho, mas resolve a duplicação de vez.
2. **Federar**: manter `escutismo_*` como está (tem requisitos muito específicos de proteção de menores que uma tabela genérica teria de replicar) e construir o novo sistema genérico só para os tipos de entidade que ainda não têm nada (instituição pública com SSO, associação com confirmação da Junta e prazo de 30 dias, paróquia, empresa, funerária, associação empresarial, sindicato, movimento cívico) — menos risco imediato, mas mantém duas arquiteturas a viver lado a lado permanentemente.
3. **Híbrido**: nova camada genérica para tudo o que é novo, e só uma view/ponte de leitura sobre `escutismo_*` para relatórios/administração cruzada, sem migrar dados.

Esta é uma decisão de arquitetura com impacto em dados reais de utilizadores (incluindo menores, no caso do escutismo) — não deve ser tomada implicitamente durante a escrita das migrations da Fase 2. Precisa da tua confirmação antes de eu escrever qualquer migration.

---

## 8. Estado final desta fase

```text
EVOLUI
```

Nenhum ficheiro de código foi alterado nesta fase. Este relatório é a única alteração (novo ficheiro em `docs/`).
