# Relatório de sessão — Módulo Escutismo

**Data:** 3–4 de setembro de 2026
**Projeto:** O Tio do Joca (OTJ)
**Módulo:** Escutismo
**Estado no fim da sessão:** schema verificado e pronto a aplicar; código de aplicação por escrever

---

## 1. O que foi feito

### 1.1 Desenho da arquitetura

O Escutismo não segue o padrão de módulo de marketplace usado no
resto do OTJ. É uma comunidade privada de escuteiros verificados, sem
anúncios e sem visibilidade pública por omissão. A decisão estruturante
foi essa, e o resto decorre dela.

Elementos definidos:

- **Grupos (agrupamentos)** com dois responsáveis obrigatórios e
  distintos, ambos referenciados em `auth.users`.
- **Confirmação dupla** — um escuteiro só tem acesso pleno depois de
  ambos os responsáveis confirmarem a inscrição.
- **Quatro tipos de comunicação:** grupo→membros, grupo→grupo,
  membro→liderança e membro→membro. Todos privados por omissão.
- **Cinco escalões:** lobinhos, escutas, pioneiros, caminheiros, adulto.
- **Auditoria transversal** com IP, user agent e ação, preparada para RGPD.

### 1.2 Administração nacional — deixada por implementar

Por decisão sua, a administração nacional (CNE ou equivalente) foi
retirada do âmbito. O espaço está reservado e documentado em comentário
no fim do ficheiro SQL, com a lista do que é preciso acrescentar quando
a decisão for tomada: tabela de admins, função `escutismo_sou_admin()`,
políticas de leitura em cada tabela e os tipos de comunicação
`nacional-grupos` e `nacional-membros`.

A plataforma funciona sem esta camada. Cada agrupamento é autónomo.

### 1.3 Proteção de menores

Requisito acrescentado a meio da sessão e que obrigou a rever o schema:

- **Data de nascimento obrigatória** na inscrição.
- **Tutela obrigatória abaixo dos 16 anos** — nome, email e relação do
  encarregado de educação. Validado por trigger na base de dados, não
  apenas no formulário.
- **Confirmação do tutor** por email com token, prazo de 7 dias. O tutor
  não precisa de ter conta na plataforma para confirmar.
- **Acesso condicionado**: um menor com a liderança já confirmada
  continua sem acesso enquanto o tutor não confirmar.
- **Acompanhamento parental** — o tutor vê o tutelado e as mensagens
  privadas dele.
- **Fotografias**: fora dos grupos restritos, imagens de menores são
  servidas desfocadas. Dentro dos grupos restritos a responsabilidade
  é dos moderadores do grupo, como definido.

### 1.4 Revisão técnica e correção

O código produzido nas iterações v2, v3 e v4 foi revisto contra um
PostgreSQL 16 real, com stubs de `auth.users` e `auth.uid()`. **Não
corria.** Foram encontrados oito problemas, cinco deles bloqueantes:

| # | Problema | Gravidade |
|---|----------|-----------|
| 1 | Índices declarados dentro do `CREATE TABLE` (sintaxe MySQL) | Bloqueante |
| 2 | Colunas `GENERATED` com `NOW()` — não `IMMUTABLE` | Bloqueante |
| 3 | `CHECK` a depender da data atual | Bloqueante |
| 4 | Recursão infinita nas políticas RLS | Bloqueante em runtime |
| 5 | Ausência total de políticas INSERT/UPDATE | Bloqueante |
| 6 | `destinatario_id` comparado com `auth.uid()` — IDs de tabelas diferentes | Falha de segurança |
| 7 | `tutor_id NOT NULL` — exigia que o tutor já tivesse conta | Falha de desenho |
| 8 | Desfoque de fotografias aplicado no browser | Falha de segurança |

O problema 8 merece registo explícito: aplicar `blur` em CSS não
protege nada. O ficheiro original é transferido para o dispositivo
antes de ser desfocado e obtém-se em claro pelo separador de rede do
browser. Era pior do que não ter proteção, por dar a impressão de que
o assunto estava resolvido.

O problema 4 só se manifesta em execução, não na criação do schema.
A primeira correção ainda deixou recursão entre `escutismo_fotos` e
`escutismo_fotos_membros`; só apareceu ao correr os testes.

### 1.5 Correções aplicadas (v5)

- Índices movidos para `CREATE INDEX` separados, vários como índices parciais.
- Idade deixou de ser armazenada. Calculada pela view `escutismo_membros_v`,
  que expõe `idade`, `eh_menor` e `tem_acesso_completo`. **É esta a view
  a usar no frontend**, não a tabela.
- Validação de tutela passou de `CHECK` para trigger.
- Seis funções `SECURITY DEFINER` para quebrar a recursão das políticas.
- Colunas de remetente/destinatário desdobradas em quatro colunas
  explícitas com chave estrangeira, eliminando o par polimórfico.
- Políticas de escrita acrescentadas, com guarda contra auto-confirmação.
- `tutor_id` opcional; tutela ancorada em `tutor_email` e na tabela
  `escutismo_tutor_convites`, que guarda apenas o hash do token.
- Fotografias em dois ficheiros: original em bucket privado, derivado
  desfocado gerado no servidor. Trigger impede publicar foto com menores
  sem versão desfocada.

---

## 2. Verificação executada

PostgreSQL 16.15 local, schema aplicado na íntegra, exercitado com seis
utilizadores: dois responsáveis, um escuteiro de 14 anos, o tutor dele,
uma escuteira de 20 anos e um utilizador sem qualquer relação.

| Teste | Resultado |
|-------|-----------|
| Schema completo executa | ✅ 136 statements, sem erros |
| Menor de 16 sem tutor | ✅ rejeitado pelo trigger |
| Menor com tutor completo | ✅ aceite |
| Autorização de imagem antes de o tutor confirmar | ✅ rejeitada |
| Maior de 16 com dados de tutor | ✅ tutela limpa automaticamente |
| View calcula idade e acesso | ✅ 14 anos → menor; 20 → não |
| Foto com menores sem derivado desfocado | ✅ rejeitada |
| Tutor vê tutelado e mensagens privadas dele | ✅ |
| Utilizador sem relação: grupos/membros/mensagens/fotos | ✅ zero em todos |
| Inscrição já como `confirmado_ambos` | ✅ bloqueada por RLS |
| Membro pendente a enviar mensagem | ✅ bloqueado por RLS |
| Recursão nas políticas | ✅ nenhuma |

Tipos TypeScript compilam com `tsc --strict` sem erros.

**Ressalva:** testado em PostgreSQL 16 puro. O Supabase acrescenta o
PostgREST e o seu próprio esquema `auth`. Confirmar no projeto real
depois de aplicar a migração.

---

## 3. Entregáveis

### Ativos

| Ficheiro | Linhas | Destino |
|----------|--------|---------|
| `escutismo-schema-v5.sql` | 804 | SQL Editor do Supabase |
| `escutismo-tipos-v5.ts` | 418 | `lib/escutismo/tipos.ts` |
| `REVISAO-ESCUTISMO-v5.md` | 266 | `docs/` |
| `ESCUTISMO-ARQUITETURA.md` | — | `docs/` (referência conceptual) |
| `ESCUTISMO-POLITICA-MENORES.md` | — | `docs/` (política; schema desatualizado, texto válido) |
| `ESCUTISMO-RESUMO-EXECUTIVO.md` | — | `docs/` |
| `ESTUDO-ESCUTISMO.md` | — | `docs/` (contexto do escutismo português) |

### Arquivados

15 ficheiros movidos para `_obsoleto/`: versões v2, v3 e v4 do schema
e dos tipos, mais os índices e checkpoints que apontavam para elas.
As versões de SQL anteriores à v5 **não correm** e não devem voltar a
circular.

Nota: a proliferação de índices e checkpoints ao longo desta sessão
(seis documentos de navegação para dois ficheiros de código) repete o
padrão de desproporção documentação/código já identificado no projeto.
A v5 reduz a documentação ativa do módulo a um documento de revisão e
três de referência.

---

## 4. Tabelas criadas (9)

```
escutismo_grupos                  Agrupamentos, 2 responsáveis distintos
escutismo_membros                 Escuteiros, tutela, autorização de imagem
escutismo_tutor_convites          Confirmação do tutor por token (hash)
escutismo_comunicacao             Mensagens, colunas explícitas de origem/destino
escutismo_fotos                   Original privado + derivado desfocado
escutismo_fotos_membros           Que membros aparecem em que foto
escutismo_confirmacoes_pendentes  Estado da confirmação dupla + tutor
escutismo_notificacoes            Notificações in-app
escutismo_auditoria               Log com marcação de envolvimento de menores
```

Mais a view `escutismo_membros_v` e seis funções auxiliares.

---

## 5. Pontos que aguardam decisão

Registados em detalhe no documento de pendências. Em resumo:

1. **Limiar de 16 vs 18 anos para o direito à imagem.** O RGPD em
   Portugal fixa o consentimento de dados nos 13; o direito à imagem
   (art. 79.º do Código Civil) acompanha a menoridade, até aos 18. Com
   o limiar atual, um escuteiro de 17 anos publica fotografias sem
   autorização parental. Sugestão: tutela aos 16, imagem aos 18.
   Confirmar com jurista.

2. **Aviso ao menor sobre o acompanhamento parental.** O tutor lê as
   mensagens privadas do tutelado. Convém que o menor veja isso escrito
   no dashboard.

3. **Administrador nacional** — quem, que email, que permissões.

4. **Agrupamentos iniciais** — nomes, associação e dois responsáveis
   por cada.

---

## 6. Estado do módulo

| Fase | Estado |
|------|--------|
| Estudo e contexto | ✅ concluído |
| Arquitetura | ✅ concluída |
| Schema SQL | ✅ escrito e verificado |
| Tipos TypeScript | ✅ escritos e compilados |
| Migração aplicada no Supabase | ⬜ por fazer |
| Server actions | ⬜ por fazer |
| Componentes e páginas | ⬜ por fazer |
| Emails e notificações | ⬜ por fazer |
| Pipeline de fotografias | ⬜ por fazer |

Progresso estimado do módulo: **35%**. O trabalho de fundação está
feito e verificado; falta a camada de aplicação.
