# Pendentes para a próxima sessão

**Escrito em:** 06/09/2026, fim do dia
**Base:** o que ficou da sessão de 06/09 e das anteriores
**Relatório da sessão:** `05-sessao/SESSION-20260906.md`

---

## Antes de qualquer coisa (10 min)

- [ ] `sed -i '/supabase.co/d' ~/.bash_history && history -c && history -r`
      — a password da base ficou no histórico
- [ ] `git status --short` — confirmar que só aparece a Fase 0 dos
      Espetáculos e os dois ficheiros locais intencionais
- [ ] Identificar o ficheiro ou pasta chamado `main` no projeto, que
      obriga a usar `git log main --` com separador

---

## P1 · SendGrid — destranca tudo o resto (30 min)

**Bloqueia:** Escutismo Fase 4, e com ela a inscrição de qualquer menor
de 18 anos, que é a maioria dos escuteiros.

Descoberto ontem: a biblioteca `@sendgrid/mail@8.1.6` está instalada e
existe `SENDGRID_API_KEY` no `.env.local`, mas **não há uma única linha
de código que envie emails**. O grep veio vazio. Nem confirmação de
registo, nem recuperação de password, nada.

Não existe `SENDGRID_FROM_EMAIL` — só a chave.

### Teste

```bash
cd ~/Nextcloud/Projectos/otiodojoca
cat > teste-sendgrid.mjs << 'EOF'
import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env.local','utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
);
sgMail.setApiKey(env.SENDGRID_API_KEY);
try {
  const [r] = await sgMail.send({
    to: process.argv[2],
    from: env.SENDGRID_FROM_EMAIL || 'noreply@superloja.com',
    subject: 'Teste SendGrid — OTJ',
    text: 'Se recebeste isto, o envio funciona.',
  });
  console.log('✅ Aceite:', r.statusCode);
} catch (e) {
  console.error('❌', e.code, e.response?.body?.errors ?? e.message);
}
EOF
node teste-sendgrid.mjs SEU_EMAIL@exemplo.pt
rm teste-sendgrid.mjs
```

O ficheiro tem de estar dentro do projeto — em `/tmp` o Node não encontra
o `node_modules`.

### Erro provável

`403 The from address does not match a verified Sender Identity`. O
`noreply@superloja.com` não deve estar verificado. Resolve-se em
SendGrid → Settings → Sender Authentication, ou por domain authentication
no Cloudflare, que era o que estava planeado para o `superloja.com`.

### Depois

- [ ] Acrescentar `SENDGRID_FROM_EMAIL` ao `.env.local` e ao Vercel
- [ ] Copiar `03_lib_email_send-secure.ts` → `lib/email/send-secure.ts`
- [ ] Confirmar que o email chega mesmo à caixa, spam incluído

---

## P2 · Sprint 10 — o que falta do lado do código (1 h)

O SQL está aplicado. Os TypeScript ainda não foram copiados.

- [ ] `mkdir -p lib/email lib/auth lib/audit lib/db`
- [ ] `00-tabelas.ts` → `lib/db/tabelas.ts`
- [ ] `03_lib_email_send-secure.ts` → `lib/email/send-secure.ts`
- [ ] `04_lib_auth_register.ts` → `lib/auth/register.ts`
- [ ] `05_lib_auth_login.ts` → `lib/auth/login.ts`
- [ ] `06_lib_audit_log.ts` → `lib/audit/log.ts`
- [ ] `npm run build`
- [ ] Commit

Ficheiros em `03-seguranca/`. O `06` foi reescrito para a tabela
`audit_log` real: `ip` e não `ip_address`, `success` booleano e não
`status`, o antes/depois dentro de `details`.

**Não integrar ainda os formulários de registo e login.** É Sprint 11 e
depende do P1.

### Ainda em aberto no Sprint 10

- [ ] Testar registo de utilizador novo. Se correr, remover a policy de
      INSERT anónimo em `profiles` — o `handle_new_user()` é
      `SECURITY DEFINER` e não precisa dela. Está reposta por precaução.
- [ ] `handle_new_user()` tem `grant execute ... to public, anon`, o que
      é desnecessário: é chamada por um trigger. Uma função definer
      invocável por `anon` é superfície de ataque gratuita.
- [ ] A função escreve `NEW.email` em `profiles`, mantendo a duplicação
      com `auth.users` contra a regra do projeto. Mexer implica tocar no
      login por username — Sprint 11.
- [ ] `profiles_select_policy` continua `USING (true)`. O email já está
      protegido pelo GRANT por coluna, mas `role` e `status` são legíveis
      por qualquer visitante — dá para enumerar admins. A correção certa
      é uma view pública.
- [ ] Nada impede um utilizador de alterar o próprio `role`. Precisa de
      um trigger que congele `role` e `status` para quem não é service
      role. Esboço no fim de `02-SEGURANCA-perfis.sql`.
- [ ] `marketplace_ads` ficou de fora de propósito. 35 pontos de chamada;
      precisa de ficheiro próprio e do marketplace testado logo a seguir.
- [ ] Limpar registos de teste em `profiles` (`TRIGGER_EXECUTADO`,
      `user@user.com`, etc.)

---

## P3 · Escutismo Fase 2 — server actions (5–6 h)

A Fase 1 está completa: 11 tabelas, 19 policies, 2 buckets, cron
agendado. Falta a camada de aplicação.

Criar `lib/escutismo/actions.ts`:

- [ ] `inscreverEscuteiro(dados)` — validar **no servidor**; se menor,
      gerar token, guardar o hash, enviar email ao encarregado
- [ ] `responderConviteEncarregado(token, decisao)` — verificar hash,
      prazo e reutilização
- [ ] `aprovarPedido(pedidoId)` / `rejeitarPedido(pedidoId, motivo)` —
      dois aprovadores distintos
- [ ] `criarAgrupamento(dados)`
- [ ] `publicarComunicacao(dados)`
- [ ] `carregarFoto(...)` — caminho `<agrupamento_id>/<nome>.jpg`,
      obrigatoriamente
- [ ] `registarAuditoria(...)` com IP e user agent

**Regra transversal:** as ações que mudam estado de filiação ou tutela
usam **service role**, não a sessão. As policies impedem propositadamente
o utilizador de se auto-aprovar; com a sessão, falham.

**Convenção de Storage:** ficheiro na raiz do bucket fica inacessível a
toda a gente, sem erro a explicar porquê.

Depois: Fase 3 (componentes, 7–9 h), Fase 4 (páginas e emails, 5–6 h,
bloqueada pelo P1), Fase 5 (pipeline de desfoque com `sharp`, 6–8 h),
Fase 6 (testes, 5–6 h), Fase 7 (integração, 2–3 h).

---

## P4 · Espetáculos Fase 0 — validar (30 min)

Feita pela outra sessão, **nunca confirmada visualmente**.

- [ ] `grep -n "tiposValidos" app/espectaculos/page.tsx` — deve ter
      `new Set<string>(`
- [ ] `npm run build`
- [ ] `npm run dev` e abrir `/` e `/espectaculos`
- [ ] Confirmar: caixa na homepage, eventos reais, filtros, ausência de
      crash sem eventos, comportamento mobile
- [ ] Commit só de `app/page.tsx` e `app/espectaculos/` — **nunca**
      `git add .`, por causa dos dois ficheiros locais intencionais

### Dois problemas a tratar

**`entidades_public_read` filtra por `estado = 'publicado'`.** A entidade
organizadora só aparece se estiver ela própria publicada. Um evento de
uma entidade em rascunho renderiza sem organizador, em silêncio. Precisa
de fallback no código.

**A rota é `/espectaculos` mas o módulo chama-se "Espetáculos".**
Pós-AO90 escreve-se sem c. URLs são difíceis de mudar depois de
indexadas — decidir agora.

O `searchParams` já está correto (`Promise` + `await`), verificado.

---

## P5 · Botão de editar nos outros 4 módulos (1–2 h)

Feito no `mercado-da-terra`. Faltam `gran-bazar`, `imoveis`, `lup`,
`viaturas` — as páginas de edição existem e funcionam, mas não há link
para elas.

O padrão está em `app/mercado-da-terra/meus-anuncios/page.tsx`: o cartão
deixa de ser um `<Link>` inteiro (link dentro de link é HTML inválido) e
ganha uma barra de ações por baixo.

Detalhe: `app/imoveis/meus-anuncios/page.tsx` tem 116 linhas contra 111
dos outros — pode divergir. Comparar antes de replicar.

Ver `docs_pendentes_EDITAR-ANUNCIOS-SEM-LINK-20260906.md`.

---

## P6 · Educação e Universidades (14–19 h)

**Nunca tocados.** Só passaram no parser — nunca correram contra um
PostgreSQL.

O `otj_test` local já está montado com o stub de `auth`, o que era o
Bloco C do plano de ontem. Está feito e serve para isto.

```bash
sudo -u postgres psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.1.sql
sudo -u postgres psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-EDUCACAO-V002.2-PATCH.sql
sudo -u postgres psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.0.sql
sudo -u postgres psql -d otj_test -v ON_ERROR_STOP=1 -f OTJ-SQL-UNIVERSIDADES-V003.1-PATCH.sql
```

Pontos de falha antecipados: blocos `DO $$ ... format('%1$I') ... $$`;
encadeamento de `SECURITY DEFINER` em `pode_gerir_escola()`; nome
auto-gerado da constraint `matriculas_universitarias_numero_estudante_key`.

Os 9 cenários de RLS antes de aplicar em produção. O cenário 3 (moderador
vê e aprova pedidos pendentes) é a razão de ser do patch. O cenário 8
(estudante não lança a própria nota) separa uma pauta de um formulário de
auto-avaliação.

### Decisões pendentes

- **DEC-2 · Identidade partilhada.** `profiles.username` já existe e é
  NOT NULL. A proposta é usá-lo como espaço de nomes global, com
  `pessoas_educacao` e `pessoas_universitarias` a passarem a perfis de
  domínio com FK para `profiles`. Custo agora: baixo. Daqui a dois
  módulos: alto. Escrever `ADR-0XX-IDENTIDADE-PARTILHADA.md`.
- **DEC-3 · RGPD de menores.** Educação recolhe dados de saúde em
  `observacoes_especiais` — categoria especial do art. 9.º — e não herdou
  política nenhuma. O Escutismo tem a sua desenhada. Falta uma política
  transversal: base legal por finalidade, AIPD (art. 35.º, provavelmente
  obrigatória), prazos de conservação, contrato de subcontratação com a
  Supabase, registo de acessos a campos sensíveis.
- **Regra em vigor:** nenhum dado real de criança na base até a DEC-3
  fechar. Só dados sintéticos.

---

## P7 · Outros pendentes, mais antigos

- **`origin/docs-audit`** — 9 commits exclusivos, 162 ficheiros, 19.662
  linhas divergentes. Não apagar sem auditoria. Mas uma divergência desta
  dimensão tende a resolver-se sozinha da pior maneira.
- **Módulo Freguesia** Fases E e F, abertas desde 19/08
- **Escutismo:** DEC-3 (administrador nacional — quem, que email, que
  permissões; espaço reservado e comentado no SQL) e agrupamentos
  iniciais para povoar
- **`~/Transferências` tem 28 ficheiros SQL** de várias sessões, com
  nomes como `code(1).sql` e `OTJ_CULTURAS_MIGRACAO_EXECUTE_AGORA.sql`.
  É assim que se corre o script errado numa base de produção.
- Pendentes de 28–30/08: OAuth social login, Netuno/códigos postais,
  StandGo/Autonex, Empregos/JobNex

---

## Regras que a sessão de ontem confirmou

1. **Verificar a base, não inferir da documentação.** As três coisas
   corrigidas em produção não constavam de documento nenhum. Os três
   diagnósticos errados vieram todos de extrapolar em vez de verificar.
2. **DDL pelo psql, não pelo SQL Editor.** O editor pede confirmação
   quando um script cria tabelas e, enquanto não se responde, não corre —
   sem erro nenhum. Custou mais de uma hora.
3. **Nada em produção sem correr em local.** O `otj_test` está montado.
4. **Nada de `supabase db diff`.** Migrations à mão.
5. **Confirmar com um segundo método.** Um `wget` com a linha corrompida
   deu uma confirmação falsa de que os emails estavam fechados.
6. **Escrever à mão os comandos curtos.** O bracketed paste corrompeu
   comandos várias vezes.
7. **`read -rsp` para segredos.** Nunca colar passwords no terminal nem
   no chat.
