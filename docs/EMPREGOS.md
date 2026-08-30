# Empregos — módulo de bolsa de emprego local do OTJ

**Estado: Fases 0–9 feitas (auditoria, arquitetura, base de dados, perfil de candidato, empresas, pesquisa/listagem pública, candidaturas, matching, admin, alertas de emprego) — última atualização 30/08/2026 21:01. Roadmap do MVP completo (Fases 2–8) mais a primeira funcionalidade pós-MVP (Fase 9); falta só o Yos testar tudo em browser, aplicar as migrations pendentes e configurar o `CRON_SECRET` em produção.**

## 0. Decisão de âmbito

Duas propostas chegaram para este módulo: (a) construir o JobNex como produto standalone independente, com a sua própria stack/auth/BD, preparado para integrar no OTJ só no futuro; (b) construir como módulo novo dentro do OTJ, reutilizando auth/BD/convenções existentes e ligado a freguesias/municípios. **Decisão do Yos, 30/08/2026: opção (b).** Este documento segue essa decisão — não há nenhuma componente standalone, nenhuma auth própria, nenhuma base de dados separada. "Empregos" é um módulo do `otiodojoca` como o StandGo, o Gran Bazar, o Lup ou o Mercado da Terra.

Nota técnica desta fase: sem terminal ligado ao computador do Yos nesta sessão, por isso esta fase ficou limitada a auditoria e documentação — nenhuma migration, nenhum ficheiro de código. Fica pronto para decisão de avançar para a Fase 2 (base de dados).

## 1. Auditoria do JobNex (demo enviada pelo Yos)

`JobNex-completo.zip` — 3 ficheiros, ~1030 linhas, front-end puro (HTML/CSS/JS vanilla), sem backend, sem `PROMPT.md`.

**O que existe:**
- Pesquisa por palavra-chave/cargo, filtro de localização, modalidade (Remoto/Híbrido/Presencial), categoria, tipo de contrato, nível de experiência, salário mínimo.
- Chips rápidos (remoto, tech, salário transparente, júnior/estágio, startup).
- Ordenação por salário (asc/desc).
- 12 vagas mock com título, empresa, localização, modalidade, tipo, nível, categoria, salário min/máx com flag "transparente", tags de competências, "publicado há X".
- Modal "Publicar vaga" — só front-end, sem submissão real.
- Duas tabs (Procurar emprego / Contratar talentos) — a segunda só abre o modal, não é uma área diferente.

**O que não existe (tudo o resto):** contas de utilizador, perfis de candidato, perfis de empresa, candidaturas, estados de candidatura, matching, alertas, dados salariais reais (só um booleano "transparente" por vaga), avaliações de empresas, mobilidade internacional, formação, CV, admin, segurança, testes, API. Isto está de acordo com o que já constava em `docs/pendentes/JOBNEX-ANALISE-20260830.md`.

**Nomes de empresas reais nos dados mock:** Farfetch, OutSystems, Unbabel, Feedzai, Talkdesk, Sword Health — empresas portuguesas reais usadas como exemplo. Confirmado que nenhum dado real de vagas foi usado, mas **estes nomes têm de ser trocados por fictícios antes de qualquer seed de demonstração no ambiente de produção do OTJ**, para não sugerir que essas empresas têm vagas reais na plataforma.

## 2. Benchmark condensado (Indeed, LinkedIn Jobs, Glassdoor, EURES, ZipRecruiter, Workable)

Classificação por funcionalidade, já no contexto do que o módulo OTJ precisa (não do JobNex demo isolado):

| Funcionalidade | Estado no JobNex demo | Para o módulo OTJ |
|---|---|---|
| Pesquisa por cargo/palavra-chave | Existente | Reaproveitar, adaptar |
| Filtros combináveis (local, modalidade, contrato, nível, salário) | Existente | Reaproveitar, adaptar |
| Pesquisa geográfica por raio | Ausente | Necessária (fase 2+, ver secção 5) |
| Perfil de candidato | Ausente | Necessária |
| CV / exportação PDF | Ausente | Desejável, não crítica no MVP |
| Perfil de empresa | Ausente | Necessária — reaproveita `entidade_pedidos` |
| Publicar vaga | Ausente (só modal decorativo) | Necessária |
| Candidatura + acompanhamento de estado | Ausente | Necessária |
| Matching candidato↔vaga | Ausente | Necessária, baseado em regras (não IA fictícia) |
| Alertas de emprego | Ausente | Desejável, fase posterior |
| Dados salariais com proveniência clara | Ausente (só "transparente" boolean) | Necessária — nunca apresentar estimativa como facto |
| Avaliações de empresas | Ausente | Desejável, precisa de moderação/anti-abuso antes de ativar |
| Mobilidade internacional / vistos | Ausente | Fora do MVP — o OTJ é focado em Portugal/local |
| Formação → competência → certificação | Ausente | Fora do MVP |
| Área de serviços (freelance) | Ausente | Fora de âmbito — já existe sobreposição com outros módulos do OTJ (Gran Bazar) |
| Admin / moderação | Ausente | Necessária — reaproveita `/admin/entidades` |
| Diferenciador local | — | **Ligação a freguesias/municípios já existentes** (câmaras, comércio local) — nenhuma das plataformas de referência tem isto; é a proposta de valor do OTJ |

## 3. O que já existe no OTJ e pode ser reaproveitado (sem inventar de novo)

- **Contas e perfis**: `public.profiles` (1 por utilizador Supabase Auth) — um `candidate_profiles` novo liga-se 1:1 a `profiles.id`, mesmo padrão que outros módulos já usam para dados específicos por utilizador.
- **Registo de empresas**: fluxo `/parceiros` + tabela `entidade_pedidos` já suporta múltiplos `tipo_entidade` (município, freguesia, organismo público, "outro", `stand_automovel`) cada um com o seu formulário dedicado e aprovação manual por admin (ver `claude/DECISAO-JANELA-ENTRADA-PARCEIROS.md` e `claude/STANDGO-STANDS-VERIFICADOS-CONTACTO-DIRETO-20260828.md`). Um `tipo_entidade = 'empregador'` novo segue exatamente este padrão — sem CAE obrigatório como o `stand_automovel` (qualquer empresa pode publicar vagas, não só um setor), mas com os mesmos campos base (nome, contacto, cargo do requerente) mais o município/freguesia.
- **Diretório curado de entidades**: `public.entidades` já tem `ref_tabela`/`ref_id` — um mecanismo genérico para ligar uma entidade curada a uma tabela de detalhe específica de um módulo. Uma tabela `empregos_empresas` (perfil de empresa: descrição, website, fotos) liga-se a `entidades` por este mecanismo, tal como (presumivelmente) outros módulos já fazem — evita duplicar o directório de entidades.
- **Localização**: `public.municipios` (308 linhas, já com `latitude`/`longitude` — reaproveitável para pesquisa geográfica por raio, o mesmo padrão que acabou de ser usado no mapa do StandGo) e `public.freguesias` (~3000 linhas, com `FreguesiaAutocomplete` já pronto). Uma vaga liga-se a `municipio_id` (FK real, não texto livre) e opcionalmente `freguesia_id`.
- **Notificações**: `public.notifications` já existe, com `type` restrito por CHECK (`reply`, `mention`, `like`, `message`, `call`, `group_invite`). Alargar o CHECK com `job_application` (candidato: houve atualização de estado) e `job_alert` (candidato: nova vaga compatível) — sem tabela nova.
- **Fotos**: `public.marketplace_photos` já serve fotos associadas a um `ad_id` de outros módulos — o padrão (não necessariamente a mesma tabela) reaproveita-se para logótipos de empresa / fotos de vaga.
- **Admin**: `/admin/entidades` já trata aprovação de pedidos de entidade — os pedidos de "empregador" entram na mesma fila. Precisa de uma área nova só para moderar vagas/denúncias, à parte.

## 4. O que precisa de tabelas novas (o domínio "emprego" é bastante mais rico que um marketplace de anúncios)

Ao contrário do StandGo/Gran Bazar (que cabem em `marketplace_ads` genérico + `details` jsonb), candidaturas, matching e histórico de estado justificam tabelas dedicadas — mesma lógica que levou o módulo social a ganhar tabelas próprias em vez de generalizar `marketplace_conversations` (ver `claude/FASE1-ARQUITETURA-MODULO-SOCIAL-20260829.md`).

Proposta de tabelas novas (nomes provisórios, schema definido só na Fase 2):

- `candidate_profiles` — 1:1 com `profiles`: profissão, resumo, experiência (jsonb ou tabela `candidate_experience` à parte), competências, formação, línguas, disponibilidade, pretensão salarial, disponibilidade para mudar de residência/viajar, controlo de visibilidade por campo.
- `empregos_empresas` — perfil de empresa, ligado a `entidades` via `ref_tabela`/`ref_id`.
- `jobs` — vaga: título, descrição, empresa, categoria, competências, experiência, `municipio_id`, modalidade (remoto/híbrido/presencial), tipo de contrato, salário min/máx, **`salario_fonte`** (`empresa` | `estimativa` — nunca apresentar estimativa como facto, ver secção 2), estado, datas.
- `job_skills` — competências pedidas por vaga (many-to-many com um catálogo `skills` pequeno e curado).
- `applications` — candidatura: `job_id`, `candidate_id` (= `profiles.id`), CV/mensagem, estado atual.
- `application_events` — histórico de mudança de estado (iniciada → submetida → em análise → entrevista → selecionada/rejeitada) — auditável, cada evento com autor e timestamp.
- `saved_jobs` — vagas guardadas por candidato (mesmo padrão do `marketplace_favorites`).
- `job_alerts` — pesquisa guardada + notificação quando aparece vaga compatível (fase posterior, não MVP).
- `salary_data` — só quando o sistema de salários avançar além do MVP: distinguir sempre `fonte` (`oficial` | `empresa` | `estimativa` | `declarado_por_utilizador`).
- `company_reviews` — avaliações de empresa, com moderação obrigatória antes de ativar (fase posterior, não MVP — precisa de mecanismo anti-abuso definido primeiro).

Todas com RLS seguindo o mesmo padrão já usado no resto do projeto (leitura pública onde faz sentido, escrita restrita ao dono/admin).

## 5. Matching — baseado em regras, não IA fictícia

Conforme pedido explícito: nada de simular um "score de IA" sem lógica real por trás. Proposta para o MVP: percentagem simples, componente a componente, com peso configurável:
- Competências: % de sobreposição entre `job_skills` e as competências do candidato.
- Localização: 100% se `municipio_id` igual, decrescendo com a distância (usando as coordenadas de `municipios`, já disponíveis).
- Experiência: comparação do nível pedido vs. declarado.
- Formação: comparação simples de nível mínimo pedido vs. declarado.

Resultado mostra sempre a decomposição (não só o número final) e assinala requisitos em falta — como no exemplo do prompt original. Motor deliberadamente simples e determinístico no MVP; preparado para ser substituído por um modelo mais sofisticado no futuro sem mudar o contrato de dados.

## 6. Roadmap proposto (adaptado ao módulo OTJ, não ao standalone)

1. **Fase 2 — Base de dados**: migrations das tabelas da secção 4, RLS, `tipo_entidade = 'empregador'` em `entidade_pedidos`, alargar `notifications.type`.
2. **Fase 3 — Perfil de candidato**: `/perfil/candidato` (ou secção do perfil existente), formulário de competências/experiência/formação.
3. **Fase 4 — Empresas**: `/parceiros/pedido/empregador`, painel de empresa para publicar/gerir vagas.
4. **Fase 5 — Pesquisa e listagem**: adaptar UX do JobNex demo (pesquisa, filtros, chips) à stack real, com pesquisa geográfica por raio usando `municipios`.
5. **Fase 6 — Candidaturas**: fluxo completo candidato→empresa, estados, histórico.
6. **Fase 7 — Matching**: motor de regras da secção 5.
7. **Fase 8 — Admin**: moderação de vagas/denúncias em `/admin`.
8. **Fase 9+ (pós-MVP)**: alertas, dados salariais estruturados, avaliações de empresa com moderação.

## 7. Por decidir antes da Fase 2

- ~~Nome definitivo do módulo~~ — **resolvido 30/08/2026 13:20**: mantém-se "JobNex" como nome provisório por agora.
- Confirmar com o Yos se "ligar a freguesias/municípios" significa só localização da vaga (proposta desta secção) ou também vagas publicadas pelas próprias câmaras/juntas como entidade empregadora (o que já é possível com o mecanismo de `entidade_pedidos` — não precisa de nada extra). **Ainda em aberto** — a Fase 2 (secção 8 abaixo) cobre os dois casos de qualquer forma (`municipio_id`/`freguesia_id` na vaga + `tipo_entidade = 'empregador'` no `entidade_pedidos`), por isso não bloqueou o arranque da Fase 2.
- Terminal ligado ao computador do Yos, para a Fase 2 poder ser implementada, testada (`db reset` local) e aplicada (`db push`) com a mesma disciplina usada no módulo social e no StandGo — não escrever migrations às cegas sem poder correr `supabase db push`/testar localmente primeiro. **Continua sem terminal nesta sessão** — a migration da Fase 2 foi escrita às cegas (ver secção 8) e o Yos tem de a testar localmente antes de aplicar.

## 8. Fase 2 — Base de dados (aplicada em produção 30/08/2026 19:15)

Migration escrita: `supabase/migrations/20260830132000_empregos_module_fase2.sql`.

Conteúdo:
- Tabelas novas: `skills` (catálogo curado, com seed inicial de ~24 competências comuns), `candidate_profiles` (1:1 com `profiles`), `candidate_skills`, `empregos_empresas`, `jobs`, `job_skills`, `applications`, `application_events` (histórico auditável, sem update/delete), `saved_jobs`.
- `entidade_pedidos.tipo_entidade` alargado com `'empregador'`.
- `notifications.type` alargado com `'job_application'` e `'job_alert'`.
- RLS em todas as tabelas novas, seguindo o padrão do resto do projeto (dono gere o seu, leitura pública só do que está aprovado/publicado).

Duas simplificações face à secção 3/4 (documentadas no cabeçalho da própria migration):
1. `empregos_empresas` liga-se a `entidades` por FK direta (`entidade_id bigint`) em vez do mecanismo genérico `ref_tabela`/`ref_id` — esse mecanismo usa `ref_id uuid` e nenhuma tabela do projeto o usa ainda de facto; FK direta é mais simples e igualmente reversível.
2. Acrescentada `candidate_skills` (não estava explícita na secção 4) — necessária para o motor de matching (secção 5) comparar competências do candidato com `job_skills` a partir do mesmo catálogo `skills`, em vez de texto livre.

**Testada e aplicada** — o Yos instalou a CLI do Supabase (`npm install -D supabase`), correu `npx supabase db reset` local (aplicou sem erros), confirmou manualmente que os CHECKs alargados funcionam (aceitam `'empregador'`/`'estimativa'`/`'empresa'`, rejeitam valores inválidos) e correu `npx supabase db push` — confirmado que era só esta migration pendente, aplicada em produção 30/08/2026 19:15.

Por implementar nas fases seguintes (sem alterações à base de dados previstas, exceto se a Fase 3+ revelar uma lacuna): Fase 6 (candidaturas), Fase 7 (matching), Fase 8 (admin).

## 9. Fase 3 — Perfil de candidato (feita 30/08/2026 19:23, por testar em browser)

Rota `/perfil/candidato` (link a partir de `/perfil`). Ficheiros:
- `app/perfil/candidato/page.tsx` — server component: autenticação, carrega `candidate_profiles`, `candidate_skills` (join com `skills`), `municipios` e o catálogo `skills`.
- `components/candidatos/candidate-profile-form.tsx` — formulário client-side (mesmo padrão do `components/profile/profile-form.tsx` existente: estado controlado + chamadas diretas ao Supabase client, sem server actions), grava `candidate_profiles` com `upsert` e depois `candidate_skills` (apaga tudo e reinsere — mais simples que diff).
- `components/candidatos/municipio-picker.tsx` — autocomplete de município que resolve para `municipio_id` (bigint), variante do `MunicipioAutocomplete` de mercado-da-terra que guarda só texto.
- `components/candidatos/skills-picker.tsx` — seletor de competências por pesquisa no catálogo `skills`, com nível (básico/intermédio/avançado) por competência escolhida.
- `app/perfil/page.tsx` — acrescentado um botão "Perfil de candidato (Empregos)" junto ao "Editar perfil".

Verificado com o `tsc` de scratch (mesma técnica do StandGo) — zero erros novos introduzidos; os únicos erros que sobram no baseline são de ficheiros que este trabalho não tocou. **Por testar no browser** (`npm run dev`) pelo Yos — esta fase não mexe na base de dados, por isso não há equivalente ao `db reset`/`db push` a fazer aqui.

## 10. Fase 4 — Empresas (feita 30/08/2026 19:34, por testar em browser)

Registo de empresa, aprovação automática e painel de gestão de vagas. Ficheiros novos ou editados:

**Registo (`/parceiros/pedido/empregador`)**
- `components/entidades/partner-request-form.tsx` — alargado `tipoEntidade` para incluir `"empregador"` (antes só `"outro" | "stand_automovel"`): esconde o seletor de categoria (irrelevante para empresas), CAE opcional (não obrigatório como no `stand_automovel`), aproveitei para corrigir uma pequena inconsistência já existente (a dica azul do StandGo aparecia para qualquer tipo com CAE a começar por "45", não só `stand_automovel`).
- `app/parceiros/pedido/empregador/page.tsx` — página nova, mesmo padrão de `pedido/stand-automovel/page.tsx`.
- `app/parceiros/page.tsx` — novo cartão "Empresa (Empregos)" na lista de tipos autenticados.

**Aprovação (admin)**
- `app/admin/entidades/actions.ts` — a aprovação de um pedido `tipo_entidade = 'empregador'` cria automaticamente a linha em `empregos_empresas` (ao contrário dos outros tipos, cuja ligação a `entidades` continua manual/à parte — aqui o registo em `empregos_empresas` É o próprio acesso ao painel, não faz sentido um segundo passo manual). Usa `createAdminClient()` (`lib/supabase/admin.ts`, service role, já existente no projeto) só para este insert, porque a RLS de `empregos_empresas` bloquearia uma escrita em nome de outro utilizador feita pela sessão do admin.
- `app/admin/entidades/page.tsx` — `TIPO_LABEL` com `empregador` (e também `stand_automovel`, que faltava) + nota explicando a criação automática.

**Painel de empresa (`/empregos/empresa`)**
- `app/empregos/empresa/page.tsx` — mostra, consoante o estado: pedido nunca feito (CTA para `/parceiros/pedido/empregador`), pedido pendente, pedido rejeitado, ou (empresa aprovada) o nome da empresa + lista de vagas com estado e ações rápidas (Publicar/Pausar/Fechar/Reabrir).
- `app/empregos/empresa/vagas/actions.ts` — as 4 ações de mudança de estado, mesmo padrão defensivo do `resolverPedido` (`.select().single()` a seguir ao update, para transformar um bloqueio silencioso da RLS num erro explícito) + `.in('estado', estadosPermitidos)` para não permitir transições inválidas.
- `app/empregos/empresa/vagas/nova/page.tsx` e `app/empregos/empresa/vagas/[id]/editar/page.tsx` — criar/editar vaga, com server actions inline (mesmo padrão de `app/viaturas/novo` e `app/viaturas/editar/[id]`). `salario_fonte` fica sempre `'empresa'` (preenchido pela própria empresa, nunca `'estimativa'` — esse valor é para uma funcionalidade futura, pós-MVP).
- `components/empregos/job-form.tsx` — formulário (server component, sem estado próprio — usa `<form action={...}>` nativo).
- `components/empregos/municipio-id-input.tsx` — variante do `MunicipioPicker` da Fase 3 pensada para formulários FormData (expõe o id resolvido via `<input type="hidden">`, em vez de um callback).
- `components/empregos/job-skills-input.tsx` — equivalente ao `SkillsPicker` da Fase 3, mas com "obrigatória" por competência em vez de "nível"; serializa tudo num único `<input type="hidden" name="job_skills_json">` (JSON) para não depender de campos indexados paralelos.

**Regra de negócio confirmada pelo Yos: só uma empresa registada (e aprovada) pode colocar vagas — não há forma de publicar sem passar primeiro pelo registo.** Isto já estava garantido em duas camadas independentes, mantidas assim de propósito:
1. Aplicação — `criarVaga` (`app/empregos/empresa/vagas/nova/page.tsx`) verifica explicitamente que existe uma linha em `empregos_empresas` para o utilizador e que `estado === 'aprovado'` antes de inserir a vaga; se não, recusa.
2. Base de dados — a única forma de existir uma linha em `empregos_empresas` é a criação automática feita por `resolverPedido` (secção 10, "Aprovação") quando um admin aprova um `entidade_pedidos` do tipo `empregador`; não há nenhum outro caminho (nenhum insert direto, nenhum auto-registo) que crie essa linha. A RLS de `jobs` ("dono gere o seu") só permite ao próprio `profile_id` da empresa inserir vagas para o seu `empresa_id` — como esse `profile_id` só existe em `empregos_empresas` depois da aprovação, é estruturalmente impossível publicar uma vaga sem ter passado por `/parceiros/pedido/empregador` → aprovação em `/admin/entidades`.

## 11. Fase 5 — Pesquisa e listagem pública (feita 30/08/2026 19:43, por testar em browser)

Motivada por feedback direto do Yos: o módulo não tinha nenhuma "caixa própria" — nem na homepage, nem uma página pública onde as vagas publicadas (Fase 4) ficassem efetivamente visíveis para quem procura emprego, ao contrário dos outros módulos (StandGo, Gran Bazar, Imóveis...) que têm sempre as duas coisas.

- `app/empregos/page.tsx` — página pública de listagem: pesquisa por texto (título/categoria), filtro por município (select) e por modalidade (chips presencial/remoto/híbrido, via query string, sem JS), só mostra vagas com `estado = 'publicada'`. Cartão por vaga com empresa, município, modalidade, categoria e salário (só aparece se a empresa o indicou).
- `app/empregos/[id]/page.tsx` — página de detalhe pública: descrição completa, competências pedidas (a distinguir obrigatória/desejável), info da empresa. Nesta fase ainda sem candidatura — o botão "Candidatar-me" só chegou na Fase 6 (secção 12).
- `app/page.tsx` (homepage) — novo `FeatureCard` "Empregos" na grelha de módulos (mesmo padrão do StandGo/Imóveis/Gran Bazar) + atalho na barra de navegação para utilizadores autenticados.

Verificado com o `tsc` de scratch — zero erros novos introduzidos. **Por testar no browser** — para veres alguma coisa em `/empregos` precisas de ter pelo menos uma vaga com `estado = 'publicada'` (usa o fluxo da Fase 4: registar empresa → aprovar → painel → nova vaga → "Publicar vaga").

## 12. Fase 6 — Candidaturas (feita 30/08/2026 19:53, por testar em browser)

Fluxo completo candidato→empresa sobre `applications`/`application_events` (Fase 2): submeter candidatura, ver o estado, retirar candidatura, e do lado da empresa, ver candidatos por vaga e atualizar o estado — com notificação em cada mudança relevante para o outro lado. Sem alterações à base de dados.

**Candidatar-se (`/empregos/[id]`)**
- `app/empregos/[id]/page.tsx` (editado) — a secção que na Fase 5 ficou como placeholder passa a ter três estados: visitante não autenticado (link para entrar/criar conta), autenticado sem candidatura ainda (formulário `<form action={candidatarVaga}>` com mensagem opcional para a empresa), autenticado já candidatado (mostra o estado atual + link para "As minhas candidaturas"). A ação `candidatarVaga` insere em `applications`, regista o evento inicial (`estado: "submetida"`) em `application_events`, e notifica a empresa.

**Candidato (`/empregos/candidaturas`)**
- `app/empregos/candidaturas/page.tsx` (novo) — lista de todas as candidaturas do candidato autenticado, com vaga, empresa, estado atual (com cor) e mensagem enviada. Candidaturas em estados ainda "vivos" (submetida/em análise/entrevista/selecionada) têm botão "Retirar candidatura" — a ação `retirarCandidatura` marca `estado: "retirada"` (nunca apaga a linha), regista o evento, e notifica a empresa.

**Empresa (`/empregos/empresa/vagas/[id]/candidaturas`)**
- `app/empregos/empresa/vagas/[id]/candidaturas/page.tsx` (novo) — lista de candidatos a uma vaga específica, com verificação de que quem vê a página é o dono da vaga (redireciona para o painel caso contrário). Por candidatura ainda não retirada, um `<select>` com os estados atribuíveis pela empresa (em análise/entrevista/selecionada/rejeitada) + botão "Atualizar estado" — a ação `atualizarEstadoCandidatura` faz o update, regista o evento, e notifica o candidato.
- `app/empregos/empresa/page.tsx` (editado) — cada vaga no painel passa a mostrar um botão "Candidaturas (N)" com a contagem de candidaturas ainda não retiradas, a ligar para a página de candidatos acima.

**Descoberta importante desta fase**: a política RLS de `notifications` só permite `insert` a `service_role` ("Sistema cria notificacoes") — nem a empresa nem o candidato conseguem inserir uma notificação para a outra parte a partir da sua própria sessão, mesmo sendo uma ação legítima sobre os seus próprios dados. Por isso, todas as notificações desta fase (candidatura nova, mudança de estado, candidatura retirada) usam `createAdminClient()` (service role, `lib/supabase/admin.ts`) só para esse insert — mesmo padrão já usado na Fase 4 para a criação automática de `empregos_empresas`.

Todas as mudanças de estado seguem o padrão defensivo já estabelecido (`resolverPedido`, `vagas/actions.ts`): `.update(...)` com `.eq()`/`.neq()` apertados, seguido de `.select().single()` — se a RLS bloquear a escrita, isto dá um erro explícito em vez de falhar silenciosamente.

Verificado com o `tsc` de scratch — zero erros novos introduzidos; os únicos erros que sobram no baseline são de ficheiros que esta fase não tocou (os mesmos de sempre: `app/perfil/page.tsx`, `app/viaturas/page.tsx`, `lib/freguesia/actions.ts`, `lib/supabase/admin.ts`/`client.ts`). **Por testar no browser** — não precisa de `db reset`/`db push` (sem alterações à base de dados). Fluxo de teste sugerido: com duas contas (candidato e empresa), candidatar-se a uma vaga publicada → confirmar notificação na conta da empresa → mudar o estado da candidatura no painel da empresa → confirmar notificação e o novo estado em `/empregos/candidaturas` do candidato → testar "Retirar candidatura" → confirmar que a vaga volta a aceitar nova candidatura do mesmo candidato só se quiseres permitir isso (atualmente `applications` não tem constraint de unicidade — retirar e voltar a candidatar-se à mesma vaga cria uma segunda linha; não bloqueado nesta fase, a confirmar se é o comportamento desejado).

## 13. Fase 7 — Matching (feita 30/08/2026 20:29, por testar em browser)

Motor de matching por regras (secção 5) implementado e ligado às três superfícies onde faz sentido aparecer: a vaga individual, a listagem pública e o painel de candidaturas da empresa. Sem alterações à base de dados.

**Motor (`lib/empregos/matching.ts`, novo)**
Função pura `calcularMatch(job, jobSkills, candidato, candidateSkills, municipiosPorId)`, sem I/O nem dependência de Supabase — recebe sempre dados já carregados pela página que a chama. Quatro componentes, cada um com peso fixo na média final (`PESOS_MATCH`, exportado): competências 40%, localização 20%, experiência 25%, formação 15%.
- **Competências** — sobreposição ponderada entre `job_skills` e `candidate_skills`: uma competência obrigatória pesa o dobro de uma desejável. Lista sempre as competências obrigatórias em falta pelo nome. Se a vaga não pediu nenhuma, o componente fica "não aplicável" e sai da média (em vez de inflacionar o score).
- **Localização** — vaga `remoto` ignora localização (score 100 sempre); caso contrário, distância real entre os municípios do candidato e da vaga via fórmula de Haversine (coordenadas já existentes em `municipios.latitude/longitude`), convertida em score por escalões (100 no mesmo município, decrescendo até 0 acima de 250 km). Candidato com "disponível para mudar de residência" marcado tem um piso mínimo de 60, para não ser penalizado pela distância. Sem município do candidato = componente não aplicável.
- **Experiência e formação** — comparação numa escala ordenada (`sem_experiencia`→`especialista`, `ensino_basico`→`doutoramento`). Vaga sem exigência = 100 (cumprido trivialmente). Candidato sem essa informação no perfil = 50 (incerto, nem penaliza nem beneficia). Candidato abaixo do pedido = score decrescente com o "gap" entre níveis, nunca chega a 0. Um candidato com nível de formação "Outro" (não comparável) também dá 50.
- Componentes não aplicáveis são excluídos da média final e os pesos dos restantes são renormalizados — um perfil incompleto nunca é punido, só produz um score calculado só com os dados disponíveis (e, no limite, `score: null` se nada for aplicável).

**Testado com 8 testes automatizados** — `lib/empregos/matching.test.ts` (vitest, `npm run test`), o primeiro ficheiro de teste do módulo Empregos. Cobre: match perfeito (100), competências obrigatórias em falta, exclusão/renormalização de componentes não aplicáveis, distância real Lisboa↔Porto (~274 km) e o respetivo escalão de score, o piso de 60 por disponibilidade de mudança de residência, decaimento gradual (nunca a zero) por gap de experiência/formação, e o caso "Outro" na formação. Todos os 8 passam.

**Vaga individual (`/empregos/[id]`, editado)**
Candidato autenticado com perfil preenchido vê um cartão "A tua compatibilidade" com o score total e a barra de progresso de cada componente (com a frase explicativa de cada um) — nunca só o número, sempre a decomposição, como pedido na secção 5. Lista também as competências obrigatórias em falta, se houver. Candidato autenticado sem perfil preenchido vê uma chamada de atenção a completar o perfil em vez de um score. Consultas adicionais: `candidate_profiles`/`candidate_skills` do próprio utilizador, e as coordenadas do município da vaga (via a relação já existente) e do candidato (consulta extra só quando é um município diferente).

**Listagem pública (`/empregos`, editado)**
Cada cartão de vaga mostra um badge "N% compatível" (verde ≥70%, âmbar 40-69%, neutro abaixo) quando o utilizador tem perfil de candidato. Competências de todas as vagas visíveis na página são carregadas num único pedido em lote (`job_skills.in(job_id, [...])`), não um pedido por vaga. Novo alternador "Ordenar: Mais recentes / Compatibilidade comigo" via query string (`?ordenar=compatibilidade`) — só aparece para quem tem perfil de candidato.

**Painel de candidaturas da empresa (`/empregos/empresa/vagas/[id]/candidaturas`, editado)**
Cada candidato à vaga mostra o mesmo badge de compatibilidade, para ajudar a empresa a priorizar quem contactar primeiro. Perfis e competências dos candidatos são carregados em lote (`.in("id", candidateIds)` / `.in("candidate_id", candidateIds)`), nunca um pedido por candidatura. **Detalhe de privacidade importante**: a RLS de `candidate_profiles`/`candidate_skills` só permite a uma empresa ler o perfil de um candidato que o tenha marcado como público ("Perfil de candidato publico visivel", `perfil_publico = true`) — para quem não o fez, a consulta em lote simplesmente não devolve essa linha, e a página mostra "perfil não público, sem dados de compatibilidade" em vez de um badge. Isto não é um bug nem uma lacuna desta fase: é a RLS já existente a funcionar como esperado, sem nenhum código extra de exceção.

Verificado com o `tsc` de scratch — zero erros novos introduzidos — e com os 8 testes de `matching.test.ts` a passar via vitest real (mesma versão e configuração do projeto). **Por testar no browser** — sugestão: preenche o perfil de candidato (`/perfil/candidato`) com algumas competências e nível de experiência/formação, marca-o como público, candidata-te a uma vaga e confirma o score em `/empregos/[id]`, em `/empregos` (lista) e, do lado da empresa, em `/empregos/empresa/vagas/[id]/candidaturas`. Testa também sem perfil público, para confirmares que a empresa não vê o badge.

## 14. Fase 8 — Admin: moderação de vagas e denúncias (feita 30/08/2026 20:44, por testar em browser)

Fecha o roadmap do MVP (secção 6). Duas peças: um mecanismo de denúncia acessível a qualquer candidato autenticado, e uma área de admin nova para as rever e para gerir diretamente o estado de qualquer vaga — coisa que, surpreendentemente, nenhum admin conseguia fazer até agora (a RLS de `jobs` só tinha políticas para a própria empresa e para o público).

**Migration nova**: `supabase/migrations/20260830203000_empregos_module_fase8.sql` — mesmo aviso das anteriores do módulo, **não testada localmente nesta sessão** (sem `device_bash`), o Yos tem de correr `supabase db reset` antes de `db push`.
- Tabela `job_reports` (denúncias): `job_id`, `reporter_id`, `motivo` (`spam`/`fraude`/`discriminatorio`/`conteudo_inadequado`/`outro`), `mensagem`, `estado` (`pendente`/`resolvida`/`ignorada`), `resolvido_por`, `resolvido_em`, `nota_admin`. RLS: qualquer autenticado cria e vê as suas próprias; administradores (`profiles.role = 'admin'`, mesmo mecanismo de `entidade_pedidos`) veem e gerem todas.
- **Política de admin nova em `jobs`** ("Administradores gerem todas as vagas") — sem alterar nenhuma política existente, só acrescenta acesso que faltava.
- Decisão de design registada no cabeçalho da migration: a rejeição por admin reutiliza o estado `rejeitada` que já existia no CHECK de `jobs.estado` desde a Fase 2 mas nunca era atingível por código nenhum (as ações da empresa — publicar/pausar/fechar/reabrir — nunca o escolhem). Reativar uma vaga rejeitada devolve-a a `pausada`, nunca diretamente a `publicada` — a empresa tem de republicar explicitamente; um admin não repõe sozinho uma vaga visível ao público.

**Denunciar uma vaga (`/empregos/[id]`, editado)**
Candidato autenticado vê um `<details>` discreto "Denunciar esta vaga" no fundo da página (sem JavaScript — é um elemento nativo do browser, não precisou de um Client Component só para um accordion), com motivo (select) e mensagem opcional. A ação `denunciarVaga` insere em `job_reports`. Se já tiveres denunciado, o formulário é substituído por uma frase de estado ("em análise pela nossa equipa" / "resolvida" / "revista, sem necessidade de ação") — evita denúncias repetidas em cadeia sem precisar de um constraint de unicidade na base de dados (mantém-se possível denunciar de novo depois de resolvida/ignorada, se for caso disso).

**Painel de moderação (`/admin/empregos`, novo)**
Mesmo mecanismo de acesso do `/admin/entidades` (`profiles.role !== 'admin'` → "Acesso restrito"), com um link de volta a essa página. Duas secções:
- **Denúncias pendentes** — cada uma mostra vaga, empresa, motivo, mensagem e quem denunciou, com dois botões: "Rejeitar vaga" (rejeita a vaga E marca a denúncia como resolvida num só passo, `rejeitarVagaEResolverDenuncia`) e "Ignorar denúncia" (marca só a denúncia como ignorada, vaga por tocar).
- **Todas as vagas** — lista com tabs por estado (Todas/Publicadas/Pausadas/Fechadas/Rejeitadas), cada linha com empresa, estado e um botão único: "Rejeitar vaga" nas que não estão rejeitadas, "Reativar (repor como pausada)" nas que estão — dá ao admin controlo direto independente de existir ou não uma denúncia associada.

`app/admin/empregos/actions.ts` segue a mesma disciplina defensiva já usada em `resolverPedido` e em `vagas/actions.ts`: a RLS é quem decide de facto se a escrita passa, o `.select().single()` a seguir transforma um bloqueio silencioso num erro explícito. Única diferença: `definirEstadoVagaAdmin` não tem guarda de estado atual (ao contrário das ações da empresa) — um admin pode repetir a mesma ação sem que isso seja tratado como erro, o que importa para a ação combinada "rejeitar vaga + resolver denúncia" continuar a funcionar mesmo que a vaga já tenha sido rejeitada por outra denúncia entretanto.

Verificado com o `tsc` de scratch — zero erros novos introduzidos (mesmos 16 erros de baseline em ficheiros não tocados). **Por testar no browser** — depois de aplicares a migration: com uma conta candidato, denuncia uma vaga publicada e confirma que o formulário desaparece e mostra o estado; com a tua conta de admin (`profiles.role = 'admin'`), entra em `/admin/empregos`, confirma que a denúncia aparece em "Denúncias pendentes", testa "Rejeitar vaga" e confirma que a vaga deixa de aparecer em `/empregos` e que a denúncia passa a "resolvida"; testa também "Reativar" e confirma que volta como pausada (não publicada) na lista da empresa em `/empregos/empresa`.

Com esta fase fecha-se o roadmap completo do MVP (secção 6): Fases 2 a 8 todas implementadas. A Fase 2 já está em produção e a Fase 7 não precisou de migration nenhuma — falta só aplicar a desta Fase 8. Falta o Yos testar tudo em browser de ponta a ponta. A secção 9+ (pós-MVP) tinha três ideias por ordenar — o Yos escolheu "alertas de emprego" como prioridade, ver secção 15.

## 15. Fase 9 — Alertas de emprego (feita 30/08/2026 21:01, por testar em browser e configurar em produção)

Primeira funcionalidade pós-MVP (secção 9+), escolhida pelo Yos entre as três propostas (alertas, dados salariais estruturados, avaliações de empresa). Candidato guarda uma pesquisa (palavra-chave/município/modalidade) com um nome à sua escolha, e recebe uma notificação sempre que surge uma vaga nova publicada que corresponda aos critérios. `notifications.type` já incluía `'job_alert'` desde a migration da Fase 2 — deixado lá de propósito à espera desta fase, não precisou de alteração agora.

**Migration nova**: `supabase/migrations/20260830210000_empregos_module_fase9.sql` — mesmo aviso das anteriores do módulo, **não testada localmente nesta sessão** (sem `device_bash`), o Yos tem de correr `supabase db reset` antes de `db push`.
- Tabela `job_alerts` (pesquisas guardadas): `candidate_id`, `nome`, `termo`, `municipio_id`, `modalidade`, `ativo`, `ultima_verificacao_em`. RLS: só o próprio candidato gere os seus (`auth.uid() = candidate_id`, `for all`).
- Tabela `job_alert_matches` (histórico de vagas já notificadas por alerta): `alert_id`, `job_id`, com `unique (alert_id, job_id)`. RLS: só `service_role` insere (mesmo motivo de `notifications` — nenhum utilizador comum devia poder inserir isto diretamente), o candidato só lê as correspondências dos seus próprios alertas.

**Nota de arquitetura importante**: ao contrário de todas as fases anteriores, esta introduz a primeira peça do módulo que corre fora do pedido de um utilizador — não há sessão nem RLS de utilizador a proteger nada, por isso o endpoint que verifica os alertas usa sempre `createAdminClient()` (service role) e é protegido de outra forma: um cabeçalho `Authorization: Bearer <CRON_SECRET>` que só a rotina agendada conhece.

**Criar e gerir alertas (`/empregos/alertas`, `/empregos/alertas/novo`, novos)**
- `app/empregos/alertas/novo/page.tsx` — formulário de criação (nome, palavra-chave, município, modalidade, todos exceto o nome opcionais). Aceita `?q=&municipio=&modalidade=` na URL para pré-preencher a partir de uma pesquisa em `/empregos` e sugerir automaticamente um nome (ex: "eletricista · Braga · Presencial").
- `app/empregos/alertas/page.tsx` — lista os alertas do candidato com os critérios, estado (Ativo/Pausado) e as vagas já encontradas por cada um (até 5 mais recentes, com link para a vaga). Ações Pausar/Reativar/Remover.
- `app/empregos/alertas/actions.ts` — `criarAlerta`, `pausarAlerta`, `reativarAlerta`, `removerAlerta`, mesma disciplina defensiva do resto do módulo (`.select().single()` a seguir ao update/delete, para transformar um bloqueio silencioso da RLS num erro explícito).
- `app/empregos/page.tsx` (editado) — novo link "🔔 Guardar esta pesquisa como alerta" junto aos filtros (só para autenticados, leva os filtros atuais na URL) e novo link "Os meus alertas" na barra de navegação.

**Verificação periódica (`app/api/cron/job-alerts/route.ts`, novo)**
Route Handler `GET`, `force-dynamic` (nunca em cache — cada chamada tem de ver o estado atual da BD), `maxDuration = 60`. Protegido por comparar o cabeçalho `Authorization` com `Bearer ${process.env.CRON_SECRET}` — responde 401 sem o segredo certo. Para cada alerta ativo: procura vagas publicadas desde a última verificação (ou desde a criação do alerta, na primeira corrida — para não inundar o candidato com o histórico todo no momento em que criou o alerta) que cumpram os mesmos critérios de pesquisa de `/empregos`, faz `upsert` em `job_alert_matches` com `ignoreDuplicates: true` (aproveitando o `unique (alert_id, job_id)` da migration — só as correspondências realmente novas voltam no `.select()`, é assim que se evita notificar duas vezes a mesma vaga) e insere uma notificação `type: "job_alert"` por cada uma. Devolve um resumo JSON (`alertasProcessados`, `notificacoesEnviadas`, `erros`) para dar para ver no log da execução.

Padrão de Route Handler confirmado pelo precedente já existente `app/api/geocode/route.ts` — não foi possível consultar `node_modules/next/dist/docs/` diretamente nesta sessão (a ponte com o dispositivo bloqueia sempre a leitura de caminhos dentro de `node_modules`), mas o `geocode` prova que `NextRequest`/`NextResponse` funcionam exatamente assim nesta versão do Next.js.

**`vercel.json` (novo)** — o projeto já estava implantado na Vercel (confirmado pela pasta `.vercel/` no repositório) e não existia nenhuma infraestrutura de tarefas agendadas até agora. Configurado com um Vercel Cron a chamar `/api/cron/job-alerts` uma vez por dia (`0 7 * * *`, 7h UTC) — frequência escolhida por ser o nível mínimo suportado nos planos gratuitos da Vercel; se o plano do projeto permitir mais frequência, o Yos pode encurtar o intervalo à vontade. Consistente com o texto já mostrado na página `/empregos/alertas` ("pode demorar até um dia a aparecer uma vaga nova").

**Passos que o Yos tem de fazer manualmente (fora do código, esta é a primeira fase do módulo que precisa disto):**
1. Gerar um valor aleatório para `CRON_SECRET` (ex: `openssl rand -hex 32`) e defini-lo tanto no `.env.local` (para testares localmente) como nas variáveis de ambiente do projeto na Vercel (Settings → Environment Variables) — sem isto o endpoint responde sempre 401 e o cron nunca chega a fazer nada.
2. Depois do deploy, o Vercel Cron começa a chamar o endpoint sozinho segundo o `schedule` do `vercel.json` — não corre em `npm run dev` local. Para testares localmente sem esperar pelo deploy, chama o endpoint à mão com `curl` (`curl -H "Authorization: Bearer <o-teu-CRON_SECRET>" http://localhost:3000/api/cron/job-alerts`) depois de criares um alerta e publicares uma vaga nova que lhe corresponda.

Verificado com o `tsc` de scratch — 18 erros no total (16 de baseline + 2 novos, ambos `Cannot find name 'process'` em `app/api/cron/job-alerts/route.ts`). Não são bugs: é a mesma classe de ruído já documentada em `lib/supabase/admin.ts`/`client.ts` (o ambiente de verificação isolado não tem os tipos do Node configurados da mesma forma que o `tsconfig.json` real do projeto) — o novo ficheiro só a herda por também ler `process.env`. **Por testar**: aplicar a migration, configurar `CRON_SECRET` (passo 1 acima), criar um alerta em `/empregos/alertas/novo`, publicar uma vaga que corresponda aos critérios, chamar o endpoint à mão (passo 2 acima) e confirmar que aparece a notificação e a vaga na lista de "Vagas encontradas" do alerta.

## Contexto relacionado

- `docs/pendentes/JOBNEX-ANALISE-20260830.md` — pendente original.
- `claude/DECISAO-JANELA-ENTRADA-PARCEIROS.md` — mecanismo de registo de entidades parceiras reaproveitado aqui.
- `claude/STANDGO-STANDS-VERIFICADOS-CONTACTO-DIRETO-20260828.md` — precedente de um novo `tipo_entidade` (`stand_automovel`) com ativação automática pós-aprovação.
- `claude/FASE1-ARQUITETURA-MODULO-SOCIAL-20260829.md` — precedente da decisão de criar tabelas novas em vez de generalizar uma estrutura genérica existente, quando o domínio é suficientemente diferente.
- `docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md` — mapa Leaflet + `municipios.latitude/longitude`, reaproveitável aqui para pesquisa por raio.
