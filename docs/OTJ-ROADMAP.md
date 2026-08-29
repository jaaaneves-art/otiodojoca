# OTJ-ROADMAP

# Roadmap de Desenvolvimento da Plataforma O Tio do Joca

## Objetivo

Este documento define a ordem de implementação da plataforma OTJ, servindo como referência para o desenvolvimento e acompanhamento do projeto.

**Actualizado em 29/08/2026, 19:32 (Europe/Lisbon)** com o estado real — este ficheiro tinha ficado parado desde a criação (15/07/2026), sem reflectir nenhum trabalho feito depois disso. Substitui `ROADMAP.md` (raiz), arquivado em `docs/project-management/ROADMAP-legado-fases-20260829.md` — era uma segunda lista de fases incompatível com esta, também parada desde julho. Ver `docs/AUDITORIA-DOCS-OTIODOJOCA-20260829.md`.

---

# Fase 0 — Fundação
**Estado:** ✅ Concluído

- Estrutura final do repositório
- Organização da documentação
- Supabase (CLI + migrations, desde agosto)
- Variáveis de ambiente
- Docker — não feito, sem necessidade identificada até agora
- GitHub Actions / CI/CD — não feito (Vercel trata do deploy automático)

**Marco:** Projeto executa localmente e em produção (Vercel). Pipeline de CI ainda não existe.

---

# Sprint 1 — Core de Identidade
**Estado:** ✅ Concluído, incluindo mais do que o previsto

- Autenticação, Perfis, Roles (enum `user`/`moderator`/`admin`), Permissões, Sessões
- MFA (autenticação de dois factores) — não estava no plano original, construído e testado de ponta a ponta em 28/08
- Recuperação de password, confirmação de email via SendGrid
- Decisão de produto (28/08): navegar/ver é público em todos os módulos; conta só é obrigatória para interagir

**Resultado:** Utilizadores conseguem criar conta, iniciar sessão, e desde 28/08 fazê-lo com MFA e email transaccional reais.

---

# Sprint 2 — Comunidade
**Estado:** 🟡 Em curso

- Fórum com categorias e tópicos — funcional
- Fotos em tópicos/respostas — concluído em 23/08
- Comentários, gostos, pesquisa — por confirmar estado exacto

**Resultado:** Fórum operacional; falta validar as funcionalidades secundárias (gostos/pesquisa).

---

# Sprint 3 — Municípios e Freguesias
**Estado:** ✅ Concluído

- Municípios (308) e Freguesias (3259) carregados, com email de contacto
- Fluxo de Entidades Parceiras (municípios, freguesias e outras entidades) construído em 23/08

**Resultado:** Entidades públicas conseguem pedir associação e publicar conteúdos.

---

# Sprint 4 — Marketplace
**Estado:** ✅ Concluído, muito além do previsto

O plano original ("Produtos, Produtores, Lojas, Pesquisa, Contactos") tornou-se **seis módulos** de marketplace, todos a reaproveitar a mesma arquitectura (`marketplace_ads`):

- **Mercado da Terra** — venda, oferta, troca, procura; fotos, mensagens com anexos, favoritos, perfil público de vendedor
- **Gran Bazar** — leilões
- **Lup** — economia circular de excedentes (doação/venda simbólica de bens perecíveis)
- **Imóveis** — venda e leilão de imóveis
- **Viaturas** — compra e venda de veículos
- **Alojamento** — reservas de casas rurais, pousadas, hotéis

Ver `docs/Modules/` para a documentação de cada um.

**Resultado:** Marketplace funcional — na prática, seis marketplaces funcionais.

---

# Sprint 5 — Agricultura
**Estado:** 🟡 Em curso

- Migration `culturas_guia` aplicada (72 culturas, 12 aptidões, 12 produtos)
- Rota `/almanaque` ligada em 23/08 (Almanaque Diário → `/calendario`, Guia de Culturas, Dashboard)
- Dados agrícolas do Volume IV do Almanaque extraídos e estruturados (`docs/Data/VOLUME_IV_DADOS_AGRICOLAS_EXTRAIDOS.md`)
- Calendário agrícola, trabalhos do mês, lua, meteorologia — por confirmar quanto já está ligado à interface

**Resultado:** Primeiro módulo agrícola disponível, ainda não completo.

---

# Sprint 6 — Pecuária
**Estado:** ⚪ Por fazer

- Espécies
- Boas práticas
- Calendários
- Recomendações

---

# Sprint 7 — Turismo e Património
**Estado:** ⚪ Por fazer

- Locais
- Roteiros
- Alojamentos — nota: "Alojamento" (reservas) já existe no Sprint 4; este item seria antes conteúdo turístico/roteiros
- Gastronomia
- Eventos

---

# Sprint 8 — Aplicação PWA
**Estado:** ⚪ Por fazer

- Offline
- Notificações
- Instalação
- Otimização móvel

---

# Sprint 9 — Inteligência Artificial
**Estado:** ⚪ Por fazer

- Assistente OTJ
- Pesquisa inteligente
- RAG
- Agentes especializados

---

# Qualidade (Contínuo)
**Estado:** 🟡 Iniciado

- Testes — Vitest configurado em 26/08, primeiro ficheiro de testes escrito (`lib/alojamento/actions.test.ts`)
- Performance, Observabilidade — não iniciado
- Segurança — auditoria de backend feita (23–28/08); dois riscos altos identificados e corrigidos (RISCO-01, RISCO-02); dois de prioridade baixa por fechar (RISCO-03, RISCO-04) — ver `docs/project-management/sessions/RELATORIO-BACKEND-API-BLOCO6-20260823.md`
- Documentação — auditada e reorganizada em 29/08 (`docs/AUDITORIA-DOCS-OTIODOJOCA-20260829.md`)

---

# Marcos

- MVP v0.1 — Core + Comunidade — ✅ atingido
- MVP v0.2 — Municípios + Eventos — ✅ atingido
- Beta — Marketplace + Agricultura — 🟡 Marketplace muito além do previsto; Agricultura em curso
- RC1 — Plataforma completa — ⚪ pendente (Pecuária, Turismo, PWA, IA por fazer)
- v1.0 — Lançamento oficial — ⚪ pendente

---

## Regra do Projeto

Nenhuma sprint é iniciada sem:
- documentação atualizada;
- testes da sprint anterior concluídos;
- revisão técnica aprovada.
