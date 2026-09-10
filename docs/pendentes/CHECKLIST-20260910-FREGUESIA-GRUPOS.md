# Checklist de sessão — Freguesia (páginas em falta) + Rede Social (Grupos)

**Data:** 10 de setembro de 2026, 18:57 (Lisboa)
**Estado:** todos os ficheiros abaixo já foram escritos diretamente no teu computador (via a ligação da sessão), na pasta `~/Nextcloud/Projectos/otiodojoca/`. Nada disto precisa de copy/paste — só falta correr os passos de verificação na secção final.

---

## 1. O que foi feito

### Módulo Freguesia — as 2 páginas em falta

- `app/(freguesia)/freguesias/page.tsx` **(novo)** — listagem de todas as freguesias, agrupadas por município.
- `components/entidades/freguesias/freguesias-list.tsx` **(novo)** — componente cliente com pesquisa por nome/município.
- `app/entidades/[slug]/page.tsx` **(novo)** — ficha de entidade: contactos, horário (com exceções/encerramentos), próximos eventos.
- `lib/freguesia/actions.ts` **(editado)** — nova função `getFreguesias()`; `getEntidadeBySlug()` passou a incluir `freguesias(cod_ine, nome)` no select, com normalização do embed PostgREST.
- `components/entidades/freguesia/entidade-card.tsx` **(editado)** — corrigido um bug de navegação: os cartões apontavam para `/freguesias/${slug}` em vez de `/entidades/${slug}`.

**Não mexido, por decisão tua:** Registo, Perfil, secção de "Entidade" no perfil de organização — ficam de fora.

### Rede Social — Fase 7 (Grupos), só o frontend (a BD/RPCs já existiam)

- `lib/social/groups.ts` **(novo)** — `groupSession()`, `pendingInvite()`.
- `app/grupos/actions.ts` **(novo)** — server actions: criar grupo, convidar, aceitar/recusar convite, sair, remover membro, mudar papel, transferir dono, enviar/apagar mensagem de grupo.
- `components/social/group-controls.tsx` **(novo)** — formulários/botões cliente, no mesmo estilo de `message-controls.tsx`.
- `app/grupos/page.tsx` **(novo)** — lista dos teus grupos + convites pendentes + criar grupo.
- `app/grupos/[id]/page.tsx` **(novo)** — página de grupo: membros, gestão de papéis, convidar, transferir propriedade, sair, chat de grupo (reaproveita a mesma infraestrutura de mensagens/media/realtime de `/mensagens`).
- `app/grupos/layout.tsx` **(novo)** — layout de navegação.
- `app/mensagens/layout.tsx` **(editado)** — adicionado link "Grupos".
- `app/perfil/page.tsx` **(editado)** — adicionado ícone/link para `/grupos`.

### Migração SQL pendente (ainda não corrida)

- `supabase/migrations/20260910120000_freguesia_rls_categorias_horarios.sql` **(novo, no disco, mas ainda NÃO executada na BD)** — cria 3 políticas `FOR SELECT ... USING (true)` em falta: `categorias_entidade`, `horarios`, `horarios_excecoes`. Sem isto, essas tabelas ficam ilegíveis mesmo com RLS+GRANT (o mesmo padrão de bug já visto antes nas tabelas `culturas_*`).

### Verificação já feita (nesta sessão, sem acesso a shell no teu PC)

- `npm install` + `tsc --noEmit` (modo strict, contra o `tsconfig.json` real) correu num ambiente à parte só com os ficheiros acima e as suas dependências diretas — passou limpo (exit 0), depois de corrigir um bug real: `entidade.horarios_excecoes || []` ficava tipado como `any` em vez de `any[]` (corrigido para `[...(entidade.horarios_excecoes || [])]`).
- Confirmado por leitura de código/migrações: o bucket de storage `social-message-media` está criado e com políticas RLS (migrações `20260909140000` e `20260909160000`) — assumindo que já correste essas migrações.
- Confirmado: não há SDK de LiveKit nem de web-push/VAPID no `package.json` nem código cliente a usá-los — chamadas e notificações push são só esqueleto de BD, não implementação. Não é um item de "verificar chaves", é um módulo por construir.

---

## 2. O que falta fazer — no teu computador

```bash
cd ~/Nextcloud/Projectos/otiodojoca

# 1. Confirmar o que mudou
git status
git diff --stat

# 2. Correr a migração RLS em falta (Freguesia)
psql "postgresql://postgres:[SUA-PASSWORD]@db.opdvusuwrhmbgkthscsc.supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260910120000_freguesia_rls_categorias_horarios.sql

# 3. Build completo (lint + env + prerender — o tsc já passou, isto confirma o resto)
npm run build
```

### Teste manual — Freguesia

- [ ] `/freguesias` — lista aparece agrupada por município, pesquisa filtra.
- [ ] `/freguesia/[cod_ine]` — continua a funcionar (não foi tocado, só confirmar).
- [ ] `/entidades/[slug]` — abre a partir de um cartão de entidade; contactos, horário e eventos aparecem; "Voltar a [freguesia]" funciona.

### Teste manual — Rede Social / Grupos

- [ ] Criar grupo em `/grupos`.
- [ ] Convidar por username; aceitar/recusar o convite com outra conta.
- [ ] Enviar mensagem de texto e com anexo no chat do grupo.
- [ ] Mudar papel de um membro (member/moderator/admin).
- [ ] Remover membro.
- [ ] Transferir propriedade do grupo.
- [ ] Sair do grupo (não sendo dono).
- [ ] Link "Grupos" visível em `/mensagens` e `/perfil`.

### Depois de tudo confirmado

```bash
git add -A
git commit -m "Freguesia: páginas /freguesias e /entidades/[slug]; Rede Social: frontend Fase 7 (Grupos)"
```

---

## 3. Em aberto, não urgente

- Chamadas (LiveKit) e notificações push (VAPID): só esqueleto de BD, sem integração no frontend — planear como módulo próprio quando fizer sentido.
- Fase F (ponte entidades ↔ módulos verticais): continua só em planeamento, sem código.
- E2E do fluxo social completo (mensagens 1:1 + grupos) — item antigo, ainda por fazer.
