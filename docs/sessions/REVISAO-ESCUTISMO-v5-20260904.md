# Revisão do módulo Escutismo — o que estava errado e o que mudou

**Data:** 4 de setembro de 2026
**Substitui:** v2, v3 e v4 (schema e tipos)

Revi o que ficou das sessões de ontem e hoje. O desenho conceptual
está bom — a arquitetura de grupos, confirmação dupla e tutela é
sólida. O código entregue, não. Encontrei oito problemas, cinco dos
quais impediam o SQL de sequer correr no Supabase.

Corri o schema num PostgreSQL 16 real, com stubs de `auth.users` e
`auth.uid()`, e testei as políticas RLS com utilizadores diferentes.
O resultado dessa verificação está no fim.

---

## Problemas encontrados

### 1. O SQL não corria. Sintaxe de MySQL. ❌ Bloqueante

Nas v3 e v4 escrevi índices dentro do `CREATE TABLE`:

```sql
CREATE TABLE escutismo_comunicacao (
  ...
  INDEX idx_criado (criado_em DESC)   -- MySQL, não PostgreSQL
);
```

O parser oficial do PostgreSQL rejeita isto: `syntax error at or near
"DESC"`. Afecta cinco tabelas em ambas as versões. Se tivesse colado
o ficheiro no SQL Editor, teria falhado na primeira tabela.

**Corrigido:** todos os índices passaram para `CREATE INDEX` separados,
alguns como índices parciais (`WHERE NOT lida`, `WHERE tem_menores`)
que são mais pequenos e mais rápidos.

### 2. Colunas geradas com `NOW()`. ❌ Bloqueante

```sql
eh_menor BOOLEAN GENERATED ALWAYS AS (
  EXTRACT(YEAR FROM AGE(NOW(), data_nascimento)) < 16
) STORED
```

Uma coluna `GENERATED ... STORED` exige uma expressão `IMMUTABLE`.
`NOW()` não é. O PostgreSQL recusa a tabela.

E há um problema mais fundo: mesmo que fosse aceite, o valor ficava
congelado. Um miúdo que faz 16 anos amanhã continuaria marcado como
menor para sempre, ou exigiria um *job* nocturno a reescrever a tabela.

**Corrigido:** a idade deixou de ser armazenada. Guarda-se apenas
`data_nascimento` e há uma view `escutismo_membros_v` que calcula
`idade`, `eh_menor` e `tem_acesso_completo` no momento da leitura.
**Use essa view no frontend**, não a tabela.

### 3. `CHECK` a depender da data actual. ❌ Bloqueante

```sql
CONSTRAINT menor_precisa_tutor CHECK ((eh_menor = FALSE) OR ...)
```

Mesma razão: um `CHECK` tem de ser imutável.

**Corrigido:** a regra passou para um trigger `BEFORE INSERT OR UPDATE`,
que é o sítio certo para validações que dependem do tempo.

### 4. Recursão infinita nas políticas RLS. ❌ Bloqueante em runtime

Este é o mais traiçoeiro, porque o schema até é criado — só rebenta
quando alguém faz uma query. A política de `escutismo_grupos`
consultava `escutismo_membros`, cuja própria política consultava
`escutismo_grupos`. O PostgreSQL devolve
`infinite recursion detected in policy`.

**Corrigido:** funções `SECURITY DEFINER` (`escutismo_meus_grupos()`,
`escutismo_grupos_que_lidero()`, `escutismo_meus_tutelados()`, etc.)
que leem as tabelas sem reactivar RLS e quebram o ciclo.

Nota honesta: a minha primeira tentativa de correcção ainda deixou
recursão entre `escutismo_fotos` e `escutismo_fotos_membros`. Só
apareceu quando corri o teste. Foram precisas mais duas funções.

### 5. Comparação de IDs de tipos diferentes. ❌ Falha de segurança

```sql
USING (destinatario_tipo = 'membro' AND destinatario_id = auth.uid())
```

`destinatario_id` continha um `escutismo_membros.id`. `auth.uid()`
devolve um `auth.users.id`. São UUIDs diferentes para a mesma pessoa,
por isso a condição **nunca era verdadeira** e ninguém veria as suas
mensagens privadas. Um par polimórfico `(tipo, id)` convida a este erro.

**Corrigido:** colunas explícitas — `remetente_membro_id`,
`remetente_grupo_id`, `destinatario_membro_id`, `destinatario_grupo_id`,
cada uma com a sua chave estrangeira. O tipo errado passa a ser
impossível de inserir.

### 6. Faltavam todas as políticas de INSERT e UPDATE. ❌ Bloqueante

As v3/v4 só tinham políticas `FOR SELECT`. Com RLS activo, isso
significa que **nenhuma inscrição e nenhuma mensagem poderiam ser
gravadas**. O módulo era só de leitura de uma base vazia.

**Corrigido:** políticas de escrita, com guardas. A de inscrição
merece destaque:

```sql
WITH CHECK (
  user_id = auth.uid()
  AND status_filiacao = 'pendente'
  AND tutor_confirmou = false
  AND autorizacao_imagem = false
)
```

Sem isto, qualquer utilizador se inseria já como `confirmado_ambos`
com o tutor confirmado, e entrava em qualquer grupo. Testei: agora
é rejeitado.

### 7. `tutor_id NOT NULL REFERENCES auth.users`. ❌ Falha de desenho

A v4 exigia que o tutor já tivesse conta na plataforma no momento em
que o filho se inscreve. Na prática, o mais comum é o contrário: o
miúdo inscreve-se e o pai só depois recebe o email.

**Corrigido:** `tutor_id` é opcional. A tutela ancora-se no
`tutor_email` e numa nova tabela `escutismo_tutor_convites`, com
confirmação por token com prazo de 7 dias. Guarda-se apenas o *hash*
do token — o token em claro existe só dentro do email.
`tutor_id` é preenchido mais tarde, se e quando o tutor criar conta.

### 8. O desfoque das fotos não protegia nada. ❌ Falha de segurança

O que eu tinha escrito:

```typescript
foto.image = await aplicarBlur(foto.image, 'heavy');  // no frontend
```

Aplicar blur no browser não é protecção. O ficheiro original é
transferido para o dispositivo antes de ser desfocado; basta abrir
o separador de rede, ou pedir o URL directamente, para ter a
fotografia nítida do menor. É pior do que não ter protecção nenhuma,
porque dá a sensação de que o problema está resolvido.

Havia também um pressuposto irrealista: "o sistema detecta menores
na foto". Detecção facial automática fiável não é coisa que se
resolva numa linha, e falhar um rosto significa publicar a cara de
uma criança.

**Corrigido — arquitectura de dois ficheiros:**

| | Onde vive | Quem acede |
|---|---|---|
| `path_original` | Bucket **privado** | Só membros e liderança do grupo |
| `path_desfocado` | Bucket público | Qualquer contexto fora do grupo |

O derivado desfocado é gerado no servidor. Fora do grupo restrito
serve-se **sempre** o derivado; se ele ainda não existir, não se serve
nada. Há um trigger que impede marcar como `concluido` uma foto com
menores sem versão desfocada.

Sobre a identificação de quem é menor: em vez de confiar em detecção
automática, a tabela `escutismo_fotos_membros` regista explicitamente
que membros aparecem em cada foto — marcados por quem carrega ou pela
liderança. Se a foto tiver menores marcados, `contem_menores` fica a
`true` e o pipeline de desfoque é obrigatório. É mais trabalho manual,
mas é auditável e não falha em silêncio.

---

## Verificação feita

Instalei PostgreSQL 16, criei stubs de `auth.users` / `auth.uid()`,
corri o schema e depois exercitei-o com quatro utilizadores: dois
responsáveis, um escuteiro de 14 anos, o tutor dele, uma escuteira de
20 e um estranho sem qualquer relação.

| Teste | Resultado |
|---|---|
| Schema completo executa sem erros | ✅ 136 statements |
| Menor de 16 sem tutor | ✅ rejeitado pelo trigger |
| Menor com tutor completo | ✅ aceite |
| Autorização de imagem antes do tutor confirmar | ✅ rejeitada |
| Maior de 16 com dados de tutor | ✅ tutela limpa automaticamente |
| View calcula idade e acesso | ✅ 14 → menor; 20 → não |
| Foto com menores sem versão desfocada | ✅ rejeitada |
| Tutor vê o tutelado e as mensagens privadas dele | ✅ |
| Estranho vê grupos / membros / mensagens / fotos | ✅ zero em todos |
| Estranho tenta inscrever-se já confirmado | ✅ bloqueado por RLS |
| Membro pendente tenta enviar mensagem | ✅ bloqueado por RLS |
| Recursão nas políticas | ✅ nenhuma |

Os tipos TypeScript compilam com `tsc --strict` sem erros.

Ressalva: isto foi testado em PostgreSQL 16 puro. O Supabase acrescenta
o PostgREST e o seu próprio esquema `auth`, por isso convém confirmar
no projecto real depois de aplicar.

---

## Dois pontos que precisam de decisão sua

### 16 anos ou 18, para o direito à imagem?

Escolheu 16 como limiar e o schema implementa 16. Mas convém separar
duas coisas que não têm a mesma idade legal em Portugal:

- **Consentimento para tratamento de dados** (RGPD, Lei 58/2019):
  13 anos. Os seus 16 são mais exigentes, o que é defensável.
- **Direito à imagem** (art. 79.º do Código Civil): a menoridade vai
  até aos 18. A autorização para publicar a fotografia de um jovem de
  17 anos é, em princípio, dos pais.

Ou seja, com o limiar em 16 um escuteiro de 17 anos publica fotografias
sem qualquer autorização parental. As associações de escutismo
portuguesas costumam pedir autorização de imagem até aos 18.

Isto muda uma constante, não a arquitectura. Sugiro separar os dois
limiares: tutela e acompanhamento aos 16, autorização de imagem aos 18.
Não sou jurista — vale a pena confirmar com quem seja, dado que o
módulo lida com crianças.

### O tutor lê as mensagens privadas do filho?

Implementei o que pediu: o tutor vê as conversas privadas do tutelado.
É defensável para um miúdo de 8 anos. Para um de 15, é uma decisão com
peso — e os escuteiros vão descobrir que é assim.

Vale a pena, no mínimo, que o miúdo veja um aviso claro no dashboard
("o teu encarregado de educação pode ler estas mensagens"). Vigilância
não anunciada tende a correr mal, e a alternativa habitual — a
conversa migra para o WhatsApp — deixa-o com menos visibilidade do
que tinha.

---

## Ficheiros

**Usar:**
- `escutismo-schema-v5.sql` — colar no SQL Editor do Supabase
- `escutismo-tipos-v5.ts` — copiar para `lib/escutismo/tipos.ts`
- este documento

**Obsoletos**, movidos para `_obsoleto/`: v2, v3 e v4 do schema e dos
tipos, e os índices que apontavam para elas. Não os use — as versões
de SQL não correm.

## A seguir

O schema está verificado; falta o código. Por ordem:

1. **Server actions** — `inscreverEscuteiro`, `enviarConviteTutor`,
   `responderConviteTutor`, `confirmarMembro`. As que mudam estado de
   filiação usam service role, não a sessão do utilizador.
2. **Formulário de inscrição** — campo de data de nascimento que revela
   a secção do tutor abaixo dos 16. Validar no servidor, sempre: o
   `eh_menor` do browser não é de confiar.
3. **Confirmação do tutor** — página com token, sem exigir conta.
4. **Fotos** — só depois. É a parte mais pesada e o resto funciona sem ela.

O espaço do administrador nacional continua reservado e comentado no
fim do SQL, como pediu.
