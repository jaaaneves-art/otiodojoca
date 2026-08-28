# Relatório completo do dia — 28 de agosto de 2026

Consolidação de tudo o que foi feito hoje na plataforma OTJ, em várias sessões/frentes de trabalho independentes. Cada tópico tem o seu relatório próprio e mais detalhado (referenciado em cada secção); este documento serve para ter a visão do dia inteira num só lugar, e sobretudo para reunir tudo o que ficou **pendente**.

Ordem cronológica pelas horas de cada sessão.

---

## 1. Teste do fluxo registo → email (SendGrid) → MFA — 09:28

**Detalhe:** `claude/TESTE-REGISTO-EMAIL-MFA-20260828.md` (projeto Claude "otj").

Primeiro teste real de ponta a ponta depois da migração de email para SendGrid (feita em 26/08).

- **Bug encontrado e corrigido:** a lista de Redirect URLs no Supabase Dashboard estava completamente vazia — sem entradas na allow-list, o link de confirmação de email não conseguia cair em `/auth/callback`. Adicionadas `http://localhost:3000/**` e `https://otiodojoca.vercel.app/**`.
- **Resultado:** registo → email SendGrid recebido → link de confirmação → `/mfa/setup` com QR code, tudo a funcionar de ponta a ponta pela primeira vez sem intervenção manual.
- **Ficou pausado a meio:** o QR apareceu mas o enrollment não foi concluído.

## 2. Decisão — Ver é público, interagir exige conta — 10:52

**Detalhe:** `claude/DECISAO-ACESSO-PUBLICO-VER-VS-INTERAGIR-20260828.md`.

Decisão do Yos: navegar/ver conteúdo em todos os módulos deve ser público, sem sessão; registo só passa a ser obrigatório para interagir (publicar, contactar, licitar, mensagens, favoritos, "os meus anúncios", pedir associação de entidade parceira).

- `lib/supabase/middleware.ts` reescrito: `PUBLIC_PATH_PREFIXES` (módulos 100% públicos: `/forum`, `/calendario`, `/comer`, `/alojamento`, `/freguesia(s)`, entre outros já existentes) + `PUBLIC_VIEW_MODULES` (novo — módulos "montra" onde a listagem e a página de detalhe ficam públicas, mas segmentos de ação como `novo`, `editar`, `mensagens`, `meus-anuncios`, `favoritos` continuam privados): Gran Bazar, Imóveis, Lup, Viaturas, Mercado da Terra, Almanaque (`dashboard`), Parceiros (`pedido`).
- Validado no código (não só suposto): as páginas de detalhe já sabiam lidar com utilizador anónimo (`user?.id` opcional nos componentes de contacto/leilão/favoritos).
- `/perfil`, `/agenda-agricola`, `/admin` **não** entraram nesta mudança — continuam privados.

## 3. Pendente registado — OAuth social login (Google/Facebook) — 10:35

**Detalhe:** `docs/pendentes/OAUTH-SOCIAL-LOGIN-20260828.md` (já no computador).

Código confirmado a funcionar corretamente (testado no browser real) — chega ao endpoint de autorização do Supabase com os parâmetros certos. O único erro é `"Unsupported provider: provider is not enabled"` — falta **apenas** ativar os fornecedores no Supabase Dashboard com credenciais OAuth reais.

**Decisão do Yos: só configurar quando o domínio definitivo do site estiver decidido**, porque o Site URL e os Redirect URLs no Supabase, e o ecrã de consentimento OAuth, devem refletir o domínio final. Passos completos para quando chegar a altura (Google Cloud Console, Facebook for Developers, Supabase Dashboard) já documentados nesse ficheiro. Apple foi descartado.

## 4. StandGo — Novos tipos: Comprar, Ceder, Alugar — 11:04

**Detalhe:** `claude/STANDGO-TIPOS-COMPRAR-CEDER-ALUGAR-20260828.md`.

StandGo passou de 2 para 5 tipos de anúncio: Venda e Leilão (já existiam) + **Procuro Comprar** (orçamento opcional, dados da viatura todos opcionais), **Ceder** (dar/entregar de graça ou valor simbólico, sem preço), **Alugar** (preço por dia obrigatório + escalões opcionais de 3 dias/semana/2 semanas/mês, caução, seguro — ao estilo rent-a-car).

- Cuidado técnico: `price_type` tem CHECK na base de dados restrito a `fixed`/`negotiable`/`free` — "Comprar" grava `null`, "Alugar" grava `"fixed"` (o preço/dia).
- **Por confirmar com o Yos:** o sentido exato de "Ceder" (assumido = grátis/simbólico, não cedência de contrato de leasing/ALD) — não teve resposta direta.

## 5. StandGo — Stands verificados podem contactar-se diretamente — 17:06

**Detalhe:** `claude/STANDGO-STANDS-VERIFICADOS-CONTACTO-DIRETO-20260828.md`.

Comerciantes automóvel registados a nível empresarial (CAE inserido manualmente, sem API pública fiável para validação automática) e aprovados por um admin podem contactar-se diretamente entre si, sem estar ligado a nenhum anúncio.

- "Stand Automóvel" tornou-se um novo tipo de entidade em `/parceiros` (ao lado de Município/Freguesia/Organismo público/Outra entidade), com CAE obrigatório.
- Aprovação com CAE a começar por `45` (comércio/reparação de veículos) ativa `profiles.is_stand_automovel` automaticamente.
- `/viaturas/stands` (diretório de stands verificados) + conversas diretas em `/viaturas/mensagens`.
- **Migration `20260828140000_stand_automovel_contacto_direto.sql` aplicada com sucesso** via `supabase db push` (foi preciso `supabase migration repair --status reverted` em 3 migrations antigas desalinhadas primeiro).
- Contas de teste criadas e ativadas: `stand.lisboa@teste.otiodojoca.local` e `stand.porto@teste.otiodojoca.local` (password `TesteStand123!`).
- **Bug transversal apanhado e corrigido:** `revalidatePath` dentro de `markAsRead()`, chamado durante o render de uma Server Component — o Next.js 16 já não permite isto. Corrigido nos 5 módulos de mensagens (Gran Bazar, Imóveis, Lup, Mercado da Terra, Viaturas), não só no StandGo.
- **Testado e confirmado a funcionar** pelo Yos em 28/08/2026: login, `/viaturas/stands`, contactar, conversa aparece com o cartão "Contacto direto entre stands".

## 6. Imóveis — Arrendamento, Permuta, Troca por companhia, Quarto — 18:31

**Detalhe:** `claude/IMOVEIS-ARRENDAMENTO-PERMUTA-QUARTO-20260828.md`.

Duas iterações no mesmo dia:

**1ª iteração** — três tipos de anúncio novos (`arrendamento` 🔑, `permuta` 🔄, `companhia` 🤝 — alojamento a troca de companhia) + categoria "Quarto" 🛏️ (migration `20260828150000_imoveis_quarto.sql`).

**2ª iteração (pivot, mesmo dia)** — por pedido do Yos, "Quarto" deixou de ser só uma categoria e passou a **tipo de anúncio próprio**, com formulário dedicado desenhado a partir de pesquisa sobre plataformas de referência (Idealista, Uniplaces, Spotahome): tipo de quarto/casa de banho (privado/partilhado), comodidades, regras da casa, etc. — **deliberadamente sem campos de preferência de género/idade dos inquilinos**, por não-discriminação. A categoria "Quarto" continua a existir, mas só como atribuição automática ao tipo `quarto`, já não é selecionável livremente.

- Nenhuma migration nova foi necessária para o pivot (`type` é texto livre).
- **Bug de renderização duplicada** apanhado e corrigido antes da entrega (campos partilhados entre secções antigas e o novo tipo `quarto` apareciam duplicados).
- **Bug lateral corrigido:** a edição de anúncios sempre reconstruía os detalhes como se fossem do tipo "venda", o que teria feito perder os campos próprios de arrendamento/permuta/companhia/quarto ao editar.
- 9 ficheiros entregues e já no computador do Yos.
- Notado, não investigado: Dashboard do Supabase a mostrar "EXCEEDING USAGE LIMITS".

## 7. Participar — split em duas rotas dedicadas (Município / Freguesia) — 19:57

**Detalhe:** `claude/DECISAO-PARTICIPAR-REGISTO-PUBLICO-20260828.md`.

Continuação da página de registo institucional público construída mais cedo (a decisão original de tornar `/participar` público, sem login prévio, tinha sido tomada ainda hoje de manhã). Depois de ver o mock, o Yos pediu para separar o wizard único em dois formulários próprios; escolheu explicitamente a opção "Duas rotas dedicadas".

- `/participar` passou a ser só uma página de escolha (Hero + dois cartões, Município/Freguesia), sem wizard nem carregamento de dados.
- `/participar/municipio` e `/participar/freguesia` (novas) — cada uma com o seu wizard de 4 passos dedicado, sem passo de escolha de tipo.
- `components/entidades/participar/participar-shared.tsx` (novo) — peças de interface partilhadas pelos dois wizards.
- `/parceiros/pedido/municipio` e `.../freguesia` atualizados para redirecionar para as rotas novas; `/parceiros` com os hrefs atualizados; `docs/PARCEIROS-ENTRADA.md` atualizado.
- Todos os ficheiros já commitados no computador do Yos; `tsc --noEmit` sem erros de sintaxe.

---

## Pendentes do dia inteiro — o que falta fazer

### A confirmar com o Yos (decisões sem resposta explícita)

- **StandGo "Ceder"** — confirmar se é mesmo "grátis/valor simbólico" ou se deveria ser "ceder contrato de leasing/ALD" (secção 4).
- **Participar** — confirmar se "substituir" as rotas antigas (`/parceiros/pedido/municipio`/`freguesia` como redirect) foi mesmo a decisão pretendida, e não coexistência (já registado em `DECISAO-PARTICIPAR-REGISTO-PUBLICO-20260828.md` desde a 1ª versão).

### Por aplicar / correr

- `supabase db push` — a migration do Participar (`20260828160000_participar_registo_publico.sql`) ainda não foi confirmada como aplicada (as migrations do StandGo e do Imóveis/Quarto já foram). Verificar com `npx supabase migration list`.
- `npm run lint && npm run build` no projeto real — nenhuma sessão de hoje conseguiu correr isto (sem shell remoto neste dispositivo); só verificações de sintaxe (`tsc --noEmit`) foram feitas onde aplicável.

### Testes por concluir

- **MFA (secção 1):** completar o enrollment (scan do QR, código de 6 dígitos), confirmar login normal a pedir só AAL2, confirmar que `/perfil` sem sessão manda para `/login`. Só depois disto a FASE 7 (rede social) pode avançar.
- **Acesso público (secção 2):** navegar sem sessão a cada módulo e confirmar que a listagem/detalhe abrem, mas `novo`/`mensagens`/`meus-anuncios`/`favoritos` continuam a pedir login — para Gran Bazar, Imóveis, Lup, Viaturas, Mercado da Terra.
- **StandGo tipos novos (secção 4):** publicar um anúncio de cada tipo (Comprar/Ceder/Alugar) e confirmar que grava sem erro; conferir a tabela de preços do aluguer na página de detalhe.
- **StandGo contacto direto (secção 5):** confirmar o contador de não lidas a incluir conversas diretas; testar o fluxo real pedido → aprovação manual → ativação automática (só as contas mock foram testadas até agora).
- **Imóveis/Quarto (secção 6):** publicar e editar um anúncio de Quarto, confirmar categoria automática, badges e comodidades no cartão/detalhe; publicar Permuta e Troca por companhia (pendente desde a 1ª iteração); testar o filtro "Só para estudantes".
- **Participar (secção 7):** testar os 21 casos da especificação original (incluindo RLS: `anon` só pode inserir `municipio`/`freguesia`; dados do responsável não legíveis fora do admin).

### Por investigar (não relacionado com nenhuma funcionalidade específica)

- Dashboard do Supabase com o badge **"EXCEEDING USAGE LIMITS"** — mencionado duas vezes hoje (secções 1 e 6), ainda não investigado em `Settings → Billing`. Vale a pena confirmar antes que afete o envio de emails (SendGrid) ou outra funcionalidade.

### Trabalho deliberadamente adiado

- **SSO institucional** (Google Workspace / Microsoft 365 do domínio da entidade) — depende do OAuth de utilizadores individuais estar configurado primeiro (secção 3), e usa um fornecedor diferente no caso do Microsoft 365 (Azure AD, não é o mesmo processo do Google/Facebook).
- Validação automática do CAE dos Stands Automóvel contra uma fonte oficial — sem API pública fiável, mantém-se manual.
- Área B2B mais ampla no StandGo (stock privado, propostas de negócio) — fora de âmbito por agora.
- Página de revisão/aprovação de pedidos de entidades para admins — hoje é feito diretamente na base de dados.
