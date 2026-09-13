# OTJ — Reconciliação e plano de continuação

- Data/hora: 13/09/2026, 17:49, Europe/Lisbon (WEST, UTC+01:00).
- Estado: **Evolução documental**, com incompatibilidade funcional prioritária identificada por inspeção estática.
- Raiz confirmada por `pwd` e `git rev-parse --show-toplevel`: `/home/berze/Nextcloud/Projectos/otiodojoca`.
- Branch: `main`; HEAD e referência local `origin/main`: `6593ab6664913502fb73b5d2155a4b55dc957d5d`; divergência `0 / 0`. Não foi feito fetch: isto não certifica o estado remoto em tempo real.
- Âmbito desta entrega: novo plano e outputs. Sem implementação, migrations, testes contra serviços, commit, push ou deploy.

## Ponto de partida e preservação

Os quatro comandos obrigatórios foram executados antes de qualquer escrita. Estado inicial:

```text
## main...origin/main
 M REGISTO-SESSOES-IA.md
 M app/admin/empregos/actions.ts
 M app/empregos/empresa/vagas/[id]/editar/page.tsx
 M docs/pendentes/PENDENTES-20260913.md
 M docs/planos/20260913T0945-plano-sessao.md
?? docs/planos/20260913T1738-plano-sessao.md
?? outputs/
?? supabase/migrations/20260913220000_job_admin_definir_estado_rpc.sql
?? supabase/migrations/20260913221000_alargar_job_editar_rpc.sql
```

Sem conflitos ou eliminações indicados; cinco ficheiros seguidos modificados, sem alterações staged. Diff herdado: 387 inserções / 75 eliminações. Os outputs das 17:38 e o plano das 17:38 já existiam. Preservar tudo; a origem das alterações em Empregos é descrita no registo e coincide com o diff. Não usar `git add -A` automaticamente para misturar trabalho e outputs.

Instruções consultadas: `AGENTS.md`, `CLAUDE.md` (remete para AGENTS), README, `docs/OTJ-CONTRIBUTING.md`, roadmap, backlog e convenções de programação em `docs/development/`. Não localizado `OTJ-INSTRUCOES-IA.md`; o caminho histórico `docs/guias/CONVENCOES-MARKDOWN.md` também não existe. O guia de contribuição pede branch própria e proíbe desenvolvimento direto em main: preparar branch isolada antes de implementação futura, preservando as alterações herdadas. Esta entrega regista a branch existente e limita-se ao plano solicitado. Antes de escrever código Next.js, ler os guias pertinentes de `node_modules/next/dist/docs/`, conforme AGENTS.

## Fontes e alcance da reconciliação

Consultados os dois planos existentes, registo integral, sessão de 12/09, sessão PWA/Espetáculos de 08/09, conteúdo dos pendentes e pesquisa temática no histórico de sessões. Aprofundados Escutismo, Educação, grupos/freguesia, Social fases 3–6/8–9, Netuno, edição de anúncios e infraestrutura. Confrontados com Git, migrations, páginas reais, actions e scripts de package.json.

Os logs desta análise estão em `outputs/20260913-1748*-*.txt` e `outputs/20260913-1749*-*.txt`, com data, pasta, comando, stdout, stderr e código de saída. Referências centrais:

- `outputs/20260913-174824-288813-documentos.txt` — registo, sessão recente, plano 17:38 e pendentes atuais.
- `outputs/20260913-174828-154050-plano-anterior.txt` — plano 09:45 completo.
- `outputs/20260913-174840-570999-pendencias.txt` — pendentes históricos.
- `outputs/20260913-174840-771949-estado-codigo.txt` — Git, diff Empregos e migrations novas.
- `outputs/20260913-174906-541929-normas.txt` — normas e auditoria herdada das 17:38.
- `outputs/20260913-174906-725706-confirmacoes.txt` — homepage, links Editar, histórico visual e Escutismo.
- `outputs/20260913-174915-505017-prioridade-real.txt` — código ativo de criação, revogação DML e assinatura da RPC.

Algumas pesquisas compostas registam erros de caminhos inexistentes em stderr, mesmo com saída final 0; esse 0 não valida cada subcomando. Ausência de resultado numa pesquisa literal não prova ausência de acessos dinâmicos. Não foram lidos valores de ficheiros de ambiente. Resultados remotos e testes antigos são **evidência documental histórica**, não execuções desta análise.

## Matriz de estado e contradições

| Área | Evidência atual / histórica | Classificação e consequência |
|---|---|---|
| Segurança de 13/09 | Commits `91700ec` e `6593ab6`; migrations de RLS, convergência admin, TRUNCATE e naming presentes. Registo confirma revogação da chave antiga e rotação CRON_SECRET pelo Yos | Concluído documentalmente e implementação versionada. Não rodar novamente nem reabrir o incidente sem nova evidência; configuração remota não reinspecionada |
| Marketplace: RPC-only | Pendentes item 5 dizem resolvido; output 17:38 e código atual mostram INSERT/UPDATE direto nas páginas novo/editar de Mercado da Terra, Gran Bazar, Lup, Imóveis e Viaturas. Migration `20260913180000` revoga DML a authenticated | **Contradição material. P0 de confirmação funcional**: incompatibilidade estática confirmada; falha remota ainda não reproduzida nesta análise. A conversão dos quatro serviços não cobre estes cinco módulos |
| Empregos | Duas actions alteradas usam `job_admin_definir_estado` e `job_editar`; duas migrations locais não seguidas. Histórico descreve teste SQL com rollback | Implementado localmente e RPC testada segundo registo; browser, validação do conjunto posterior a 6593ab6 e commit ainda pendentes. Não reimplementar as duas correções |
| Testes falsos | Ambos os ficheiros antigos ausentes; `tests/e2e/rpc-only-writes.e2e.test.ts` e `social-complete.e2e.test.ts` presentes | Remoção/substituição concluída. Item que ainda manda apagar SQL é obsoleto. Não contar antigos testes vazios como cobertura |
| Datas / menoridade | `c39501c` corrige e_menor_agora; plano 09:45 regista revisão de 12 funções sem outro caso | Item 4 dos pendentes ficou desatualizado. Não repetir varrimento sem alteração nova |
| Fase F | Ligação entity_id versionada, registo de backfill remoto e confirmação visual de `/entidades/casa-rural-ronfe` | Fechada no âmbito ligação/backfill/ficha, segundo histórico. Checklist 10/09 e início do plano 09:45 estão ultrapassados. Não refazer backfill. Não localizado ficheiro local com nome `*backfill*`: rastreabilidade/reprodução desse SQL por verificar, não reaplicar |
| Dados “reais” | Plano chama inicialmente 16 linhas reais; atualização posterior regista confirmação do Yos de dados mock/demo | Priorizar correção posterior; não inferir que a BD atual continua só com mock nem que se podem eliminar dados |
| Adesões | Commit `6116cc0`, migration `20260912210000_adesoes_v001.sql` | Não executar novamente SQL de 07/09 só porque o pendente antigo o manda |
| Escutismo Fase 2 | `lib/escutismo/actions.ts` e `tipos.ts` presentes/versionados. Código documenta schema v1, tutoria e ausência de consentimento | Parcial, sem validação runtime documentada das actions. Não recriar a parte escrita nem aplicar v5 antiga. Fluxo tutor exige decisão |
| Educação/Universidades | Nota de 13/09 corrige “pronto a aplicar”; `lib/educacao` ausente | Tentativa de retoma não resultou em aplicação. Desenvolvimento ainda por fazer sobre Adesões; não executar SQL presumido existente |
| Social | Rotas mensagens/grupos/perfis/feed e documentação fases presentes; testes reais posteriores para posts/comentários/RPC | Implementação existente, validação parcial. Testes de posts não certificam mensagens/anexos/grupos/realtime/retenção. Docs antigos dizem migrations não aplicadas; não inferir aplicação global a partir do nome da fase |
| Público/privado | `app/perfil/[id]/page.tsx` seleciona campos públicos explicitamente; rotas próprias e de edição existem; commit `05d1105` | Separação já iniciada/implementada nesses pontos; permissões completas entre contas por validar, não redesenhar de raiz |
| Caixa OTJ | `app/page.tsx:20–23` tem Fórum Agrícola, Agenda Agrícola, Calendário Lunar e Almanaque com rotas | Nomes e entradas já feitos. Menus restantes/SEO/mobile não auditados integralmente; não renomear novamente |
| Lup e StandGo | Commits `a0798f0` (Lup) e `0217692` (StandGo), componentes atuais | Grafismo já renovado. Não iniciar novo redesign por pendente antigo; revisão visual futura deve partir destes ficheiros |
| Edição de anúncios | As cinco páginas `app/*/meus-anuncios/page.tsx` já contêm links para editar | Pendente 06/09 “sem ponto de entrada” ultrapassado no código. Link existente não prova gravação funcional (ver RPC-only) |
| Duplicação de submissões | Lup já verifica `submitting`, desativa botão e mostra “A guardar…”; action cria diretamente, sem chave de pedido nesse caminho | Proteção cliente presente; idempotência servidor não demonstrada. Auditar concorrência/reenvio no âmbito do fluxo escolhido, sem declarar todos os módulos protegidos |
| Alojamento | Sem chamadas das duas actions de atualizar/cancelar em app/components; testes e README referenciam-nas | Sem UI ligada na pesquisa efetuada. “Código morto” não significa sem referências: preservar testes até decidir remover ou ligar UI via RPC |
| PWA / Espetáculos | Sessão 08/09 descreve PWA fases 1–5 e Espetáculos 6–7 com testes locais; Stripe por duplos | Roadmap de agosto “PWA por fazer” obsoleto. Dispositivos físicos e Stripe TEST real continuam por validar; não recriar PWA nem chamar duplos de teste Stripe real |
| Netuno | Documento arquivado marca resolvido em 30/08 | Não repetir limpeza/importação |
| Infraestrutura | `schema_paths = []` confirmado; SendGrid pausado por domínio segundo pendente | DB declarativo adiado, não bloqueia este plano. Não gerar/aplicar db diff indiscriminadamente; email pode bloquear escolha de fluxo de tutor |

O registo contém “ainda não passou pelo origin” e posteriormente “push feito”: Git confirma HEAD igual à referência local origin/main. A frase inicial é histórica. Da mesma forma, “132 testes / 94 páginas” refere-se à validação anterior às últimas alterações locais; não certifica o estado atual. `docs/sessions/SESSAO-20260912.md` está seguido por Git, contrariando a generalização antiga de que sessões nunca entram no histórico.

## Pendências herdadas consolidadas

1. Fechar validação browser e preparar versionamento das correções já escritas de Empregos, mantendo código e migrations juntos.
2. Escutismo: testar inscrição/pedido/decisão já escritos; decidir consentimento específico com tutoria confirmada versus token próprio; depois UI/rotas. SendGrid continua condicionado ao domínio definitivo.
3. Educação/Universidades: especificação e implementação real sobre Adesões; documentos antigos não são pacote executável.
4. Social: validação entre contas de mensagens, grupos, anexos privados, realtime, notificações e retenção; confirmar migrations efetivamente aplicadas antes de qualquer reaplicação.
5. PWA físico e Stripe TEST real; OAuth/configuração externa; fluxo declarativo de BD; Almanaque/rebranding/numeração e restantes itens de conteúdo em sessões próprias.
6. Fase F: eventual criação de verticais na aplicação, consistência dos campos duplicados e rastreabilidade do backfill; não confundir com ligação já entregue.
7. Reservas: decisão sobre UI de gestão versus remoção de actions sem chamadores de aplicação.
8. Grants DML globais: revisão tabela a tabela em sessão dedicada, conforme decisão registada. Não revogar em massa.
9. P-final: hubs dos quatro serviços e testes multiutilizador associados; regras 16–18. Manter no fim conforme decisão explícita, sem promover para tarefa imediata.

Os antigos erros 500 de Vercel/404 de reservas e tarefas de reorganização documental carecem de confirmação específica atual: não classificados como incidentes ativos apenas por existirem ficheiros antigos. O sucesso de build não fecha um erro runtime de endpoint. Nenhuma eliminação de projeto remoto é proposta nesta sessão.

## Prioridades e ordem recomendada

1. **P0 — confirmar e delimitar incompatibilidade Marketplace/RPC-only.** Começar por Lup: formulário chama uma action real que usa cliente de sessão e INSERT direto; comparar contrato da RPC e grants do ambiente alvo em leitura. Reproduzir em ambiente de teste antes de concluir “produção partida”.
2. **P1 — correção mínima do primeiro fluxo confirmado**, numa branch própria, com teste de criação/edição e permissões. Inventariar depois o mesmo problema nos outros quatro módulos. Não reabrir permissões para contornar as RPC.
3. **P1 — validar Empregos já alterado**, testes/browser admin e dono, revisão dos dois ficheiros SQL e seleção explícita dos ficheiros a versionar. Sem novo desenvolvimento de Empregos se as correções passarem.
4. **P2 — Escutismo parcial e Social por validar**, uma unidade de cada vez, dependências de consentimento decididas antes de construir UI dependente.
5. **P3/P4 — Educação, infraestrutura, aperfeiçoamentos e documentação residual**, mantendo P-final no final.

Esta ordem difere do plano das 17:38 (avançar Escutismo) porque o próprio output dessa hora já continha escritas diretas não reconciliadas com a conclusão documental de RPC-only. A revisão não é repetição inútil: resolve essa contradição concreta.

## Primeira tarefa escolhida para a continuação

**Problema:** criação/edição Lup usa DML direto em marketplace_ads, incompatível com a revogação versionada de permissões.

**Resultado esperado:** diagnóstico reproduzível do fluxo e contrato completo necessário à correção; só depois implementar preservando module, type, price, price_type, contact_method, details, ownership e fotografias. A RPC criar inspecionada recebe apenas título, descrição, tipo, details, localização e categoria: trocar só o nome da chamada perderia campos importantes. Viaturas tem ainda IDs do catálogo próprios.

**Ficheiros/áreas a analisar:** `app/lup/novo/page.tsx`, `app/lup/editar/[id]/page.tsx`, `components/lup/lup-ad-form.tsx`, actions equivalentes nos outros quatro módulos, `lib/marketplace/`, migrations criar/editar e revogação de 13/09, tabelas/constraints/fotografias, `tests/e2e/rpc-only-writes.e2e.test.ts`. Determinar separadamente se `app/mercado-da-terra/actions.ts` e `components/mercado-da-terra/new-ad-form.tsx` ainda têm chamadores; não alterar código apenas por uma ocorrência textual.

**Validação prevista:**

- Inspeção read-only de grants/assinaturas/migrations do ambiente alvo; nenhuma reaplicação automática.
- Reprodução autenticada no ambiente de teste e comparação antes/depois; dono, outro utilizador e visitante; persistência de todos os campos, falhas de upload, edição e regresso à listagem.
- Pedidos repetidos/concorrrentes: confirmar uma única criação se o contrato passar a exigir idempotência; botão desativado sozinho não basta.
- Empregos: rejeitar/reativar em `/admin/empregos`, editar dez campos na página da empresa, rejeitar não dono, tratar ID inexistente/retorno false.
- Scripts existentes: `npm test`, `npm run build`, `npm run lint`; selecionar testes focados primeiro. `prebuild` gera Almanaque, pelo que rever artefactos gerados; testes E2E carregam ambiente e podem escrever numa BD real, identificar o alvo antes de executar.
- `git diff --check`, diff final e saídas com códigos efetivos. Build/lint não provam RLS. Não repetir suites extensas sem nova alteração ou dúvida concreta.

## Riscos, limites e próximo passo

Riscos: alterações herdadas em main; divergência aplicação/schema remoto; RPC incompleta para campos dos cinco módulos; perda de dados numa troca superficial de chamadas; permissões e overloads de funções; falsa confiança em testes antigos, mocks e checklists; interferência de alterações geradas pelo prebuild. A remoção do overload antigo de job_editar está depois do COMMIT no SQL local: rever atomicidade/rastreabilidade antes de qualquer reaplicação, sem alterar agora.

Não foi comprovado nesta análise qualquer erro em execução atual, nem a aplicação remota de todas as migrations. Há evidência suficiente para priorizar o diagnóstico do Marketplace sem inventar um novo incidente de segurança. A revisão estática executada incluiu `git diff --check`, sem diagnósticos. Não houve build, lint, testes de BD, acesso ao dashboard ou alterações funcionais.

**Próximo passo concreto recomendado:** na continuação autorizada, confirmar em leitura os grants/contrato RPC do ambiente de teste e reproduzir a criação de um anúncio Lup com sessão de utilizador. Usar este resultado para a primeira correção focada; preservar as alterações de Empregos e não iniciar Escutismo em paralelo. Este pedido termina na entrega do plano, sem executar essa continuação e sem abrir documentos de fecho de sessão.
