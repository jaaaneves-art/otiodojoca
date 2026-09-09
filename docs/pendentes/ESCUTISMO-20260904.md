# Pendentes — Módulo Escutismo

**Aberto em:** 4 de setembro de 2026
**Base:** `escutismo-schema-v5.sql` (verificado) e `escutismo-tipos-v5.ts`
**Documento de contexto:** `REVISAO-ESCUTISMO-v5.md`

Lista de trabalho por fazer. Ordenada por dependência: cada bloco
pressupõe o anterior. Os tempos são estimativas para sessões focadas.

---

## Bloqueadores de decisão

Estes não são tarefas de código. Impedem ou condicionam o que vem
a seguir e devem ser decididos antes das fases correspondentes.

### D1 — Limiar de idade para o direito à imagem
**Condiciona:** Fase 1 (schema) e Fase 5 (fotos)

O schema implementa 16 anos para tudo. Em Portugal os dois limiares
não coincidem:

- Consentimento para tratamento de dados (RGPD, Lei 58/2019): **13 anos**
- Direito à imagem (art. 79.º do Código Civil): acompanha a menoridade, **18 anos**

Com a configuração atual, um escuteiro de 17 anos publica fotografias
sem qualquer autorização parental. As associações de escutismo
portuguesas costumam pedir autorização de imagem até aos 18.

**Proposta:** separar em duas constantes — tutela e acompanhamento aos
16, autorização de imagem aos 18. É uma alteração de constante, não de
arquitetura, mas é melhor fazê-la antes de aplicar a migração.

**Ação:** confirmar com jurista. O módulo lida com crianças e a
responsabilidade não é do foro técnico.

### D2 — Aviso de acompanhamento parental
**Condiciona:** Fase 3 (componentes)

O tutor lê as mensagens privadas do tutelado. Está implementado como
pedido. Falta decidir como é comunicado ao menor.

Sem aviso, os escuteiros descobrem-no de outra forma e a conversa migra
para o WhatsApp — o que deixa a liderança com menos visibilidade do que
tinha. Sugestão mínima: aviso permanente no dashboard do menor.

### D3 — Administrador nacional
**Condiciona:** nada de imediato. O espaço está reservado.

Por decidir: se existe, quem é, que email, que permissões. O que é
preciso acrescentar está comentado no fim de `escutismo-schema-v5.sql`.

### D4 — Agrupamentos iniciais
**Condiciona:** Fase 6 (testes ponta a ponta)

Necessário para povoar: nome do agrupamento, associação (CNE, AEP,
outra), região, email de contacto e **dois responsáveis distintos**
com nome e email cada.

### D5 — Integração no OTJ
**Condiciona:** Fase 7

O Escutismo aparece na homepage? Liga ao calendário agrícola ou às
tradições (Janeiras)? Ou fica como área autónoma acessível só por link?

---

## Fase 1 — Migração (0,5–1 h)

- [ ] Rever D1 antes de aplicar. Se o limiar de imagem mudar para 18,
      ajustar `escutismo_eh_menor()` e acrescentar
      `escutismo_precisa_autorizacao_imagem()` antes de correr.
- [ ] Aplicar `escutismo-schema-v5.sql` no SQL Editor do Supabase.
- [ ] Confirmar as 9 tabelas, a view `escutismo_membros_v` e as 6 funções.
- [ ] Confirmar que RLS está ativo em todas as tabelas.
- [ ] Repetir no Supabase os testes já passados em local: inserir um
      menor sem tutor (deve falhar), um utilizador sem relação a ler
      grupos (deve devolver zero).
- [ ] Versionar a migração em `supabase/migrations/` com timestamp.
- [ ] Copiar `escutismo-tipos-v5.ts` para `lib/escutismo/tipos.ts`.
- [ ] `npm run build` para confirmar que os tipos compilam no projeto.

**Risco conhecido:** o schema foi validado em PostgreSQL 16 puro. O
Supabase acrescenta PostgREST e o seu próprio esquema `auth`. Podem
surgir diferenças, sobretudo nas funções `SECURITY DEFINER` e no
`security_invoker` da view.

---

## Fase 2 — Server actions (5–6 h)

Criar `lib/escutismo/actions.ts`.

- [ ] `inscreverEscuteiro(dados)`
      - Validar com `InscricaoEscuteiroSchema` **no servidor**. O
        `eh_menor` calculado no browser não é de confiar.
      - Se menor: gerar token, gravar hash em `escutismo_tutor_convites`,
        enviar email ao tutor.
      - Criar linha em `escutismo_confirmacoes_pendentes` com
        `requer_tutor` correto.
- [ ] `responderConviteTutor(token, decisao, autorizaImagem)`
      - Verificar hash, prazo e se já foi usado.
      - Atualizar `tutor_confirmou` e, se aplicável, `autorizacao_imagem`.
      - Notificar a liderança.
- [ ] `confirmarMembro(membroId)` / `rejeitarMembro(membroId, motivo)`
      - Identificar qual dos dois responsáveis está a confirmar.
      - Transição `pendente → confirmado_1 → confirmado_ambos`.
      - Se menor e tutor ainda não confirmou, **não** dar acesso.
- [ ] `criarGrupo(dados)` — validar que os dois responsáveis são distintos.
- [ ] `publicarComunicacao(dados)`
- [ ] `registarAuditoria(...)` — usado por todas as anteriores, com IP
      e user agent.

**Regra transversal:** as ações que alteram estado de filiação ou tutela
usam **service role**, não a sessão do utilizador. As políticas RLS
impedem propositadamente o utilizador de se auto-confirmar; se estas
ações usarem a sessão, vão falhar.

**Regra de auditoria:** escritas em `escutismo_auditoria` só por service
role. O log tem de ser imutável do ponto de vista do utilizador.

---

## Fase 3 — Componentes (7–9 h)

Criar em `components/escutismo/`.

- [ ] `form-inscricao.tsx`
      - Campo de data de nascimento que revela a secção do tutor
        quando a idade calculada fica abaixo do limiar.
      - Impedir que o email do tutor seja igual ao do escuteiro.
      - Revalidar sempre no servidor.
- [ ] `dashboard-escuteiro.tsx`
      - Usar `escutismo_membros_v`, não a tabela.
      - Estado da inscrição com `motivoSemAcesso()`.
      - **Aviso de acompanhamento parental** se aplicável (ver D2).
- [ ] `dashboard-lideranca.tsx`
      - Lista de confirmações pendentes, com marca visível de menor e
        estado da confirmação do tutor.
- [ ] `dashboard-tutor.tsx`
      - Tutelados, atividade, mensagens, fotos onde aparecem.
      - Revogar autorização de imagem.
- [ ] `confirmar-membros.tsx`
- [ ] `comunicacao-item.tsx` / `comunicacao-form.tsx`

---

## Fase 4 — Páginas, rotas e emails (5–6 h)

- [ ] `/auth/signup-escuteiro`
- [ ] `/escutismo` — dashboard, com rota condicional ao papel
- [ ] `/escutismo/confirmacoes` — liderança
- [ ] `/escutismo/tutor` — tutores
- [ ] `/escutismo/comunicacao`
- [ ] `/escutismo/tutor/confirmar/[token]` — **sem exigir sessão**. O
      tutor pode não ter conta.
- [ ] Middleware de acesso: um membro sem `tem_acesso_completo` só vê a
      página de estado.

Emails (SendGrid, `noreply@superloja.com`):

- [ ] Convite ao tutor, com botões de confirmar e rejeitar
- [ ] Nova inscrição pendente → responsáveis
- [ ] Tutor confirmou → responsáveis
- [ ] Inscrição completa → escuteiro (e tutor, se menor)
- [ ] Inscrição rejeitada, com motivo
- [ ] Lembrete ao 3.º dia se o convite do tutor continuar por responder

**Nota:** o teste definitivo do SendGrid continua adiado no projeto.
Convém resolvê-lo antes desta fase, porque todo o fluxo de inscrição
de menores depende de email entregue.

---

## Fase 5 — Fotografias (6–8 h)

A parte mais pesada. Tudo o resto funciona sem ela — deixar para o fim.

- [ ] Criar dois buckets no Supabase Storage: um privado para originais,
      um público para derivados desfocados.
- [ ] Políticas de Storage a espelhar as políticas RLS das tabelas.
- [ ] Upload: gravar em `escutismo_fotos` com `estado_processamento`
      a `pendente`.
- [ ] Marcação de membros presentes na foto (`escutismo_fotos_membros`),
      feita por quem carrega ou pela liderança.
      **Não usar deteção facial automática** — falhar um rosto significa
      publicar a cara de uma criança. A marcação explícita é auditável.
- [ ] Job de processamento (`sharp`) que gera o derivado desfocado e
      passa o estado a `concluido`.
- [ ] Servir através de `resolverPathFoto()`. Fora do grupo restrito
      serve-se **sempre** o derivado; se não existir, não se serve nada.
- [ ] Revogação: se o tutor revogar a autorização, remover o original
      dos contextos públicos e registar em auditoria.

**Não repetir o erro da v4:** blur em CSS não é proteção. O ficheiro
original chega ao dispositivo antes de ser desfocado e obtém-se em
claro pelo separador de rede.

---

## Fase 6 — Testes (5–6 h)

- [ ] Inscrição de menor sem tutor → rejeitada
- [ ] Inscrição de menor com tutor → pendente, email enviado
- [ ] Tutor confirma → acesso só depois de a liderança também confirmar
- [ ] Liderança confirma primeiro → acesso continua bloqueado até ao tutor
- [ ] Token expirado → recusado
- [ ] Token reutilizado → recusado
- [ ] Membro de um grupo tenta ler outro grupo → zero linhas
- [ ] Tentativa de inscrição direta como `confirmado_ambos` → bloqueada
- [ ] Membro pendente tenta enviar mensagem → bloqueado
- [ ] Foto com menor em contexto público → serve o derivado, nunca o original
- [ ] Verificar no separador de rede que o original **não** é transferido
- [ ] Escuteiro que faz 16 anos → `eh_menor` passa a falso sem intervenção

---

## Fase 7 — Integração e lançamento (2–3 h)

- [ ] Decidir D5 e implementar o ponto de entrada
- [ ] Povoar os agrupamentos de D4
- [ ] Registo de tratamento de dados de menores (RGPD)
- [ ] Exportação de consentimentos, para pedidos de titulares
- [ ] Deploy e verificação em produção

---

## Estimativa

| Fase | Horas |
|------|-------|
| 1 — Migração | 0,5–1 |
| 2 — Server actions | 5–6 |
| 3 — Componentes | 7–9 |
| 4 — Páginas e emails | 5–6 |
| 5 — Fotografias | 6–8 |
| 6 — Testes | 5–6 |
| 7 — Integração | 2–3 |
| **Total** | **31–39 h** |

Sem a Fase 5, o módulo é utilizável em **25–31 h**. As fotografias
podem entrar numa segunda iteração.

---

## Dependências externas

| Item | Estado | Impacto |
|------|--------|---------|
| Teste definitivo do SendGrid | adiado no projeto | Bloqueia Fase 4 |
| `sharp` instalado | por confirmar | Bloqueia Fase 5 |
| Buckets de Storage | por criar | Bloqueia Fase 5 |
| Parecer jurídico sobre D1 | por pedir | Condiciona Fases 1 e 5 |

---

## Ficheiros a não usar

`_obsoleto/` contém as versões v2, v3 e v4 do schema e dos tipos, mais
os índices e checkpoints correspondentes. **As versões de SQL anteriores
à v5 não correm** — têm sintaxe de MySQL e colunas geradas inválidas.
Se reaparecerem em pesquisa, ignorar.
