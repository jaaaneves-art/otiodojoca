# LUP — preparação do E2E real, pendente de autorização

13/09/2026, 19:54, Europe/Lisbon (WEST, UTC+1).
Branch confirmada: `fix/lup-rpc-20260913`. Alterações herdadas preservadas;
`git diff --check` sem diagnósticos. Nenhuma migration aplicada nesta fase.

## Ambiente encontrado

Supabase **local de desenvolvimento**, Docker `supabase_*_otiodojoca`:
API em `http://127.0.0.1:54321`, PostgreSQL local em porta 54322,
Auth, PostgREST e Storage reais em containers locais. Não é o projeto remoto
Supabase referido no histórico. Nenhum acesso a produção nesta fase.
A inspeção local encontrou 0 utilizadores em auth.users e 0 marketplace_ads.
Isto não significa que todas as outras tabelas estejam vazias ou sejam descartáveis.
As portas dos containers existentes estão publicadas em 0.0.0.0; os testes
serão dirigidos apenas a loopback. Não foi alterada configuração de rede.

A documentação `docs/devops/OTJ-DEVOPS-V02-AMBIENTES.md` descreve staging
conceptualmente, mas não identifica endpoint/credenciais/instância verificável.
Não foi encontrado staging remoto comprovado nos ficheiros consultados.
`.env.local` não será reutilizado para o E2E: o servidor Next terá variáveis
explicitamente locais e os scripts deverão recusar hosts remotos.

## Porque não aplicar já a migration LUP

O stack local existente é diferente das bases isoladas autorizadas na fase
anterior. Prepará-lo altera o schema da BD de desenvolvimento, pelo que a
aprovação anterior dos testes isolados não é interpretada como autorização
para esta operação. Pedido atual, pontos 5–6: apresentar alvo/SQL/risco e
pedir autorização explícita se não existir autorização anterior aplicável.

Faltam no stack local: `config_plataforma`, `grupos`, `adesoes`, helpers
`e_menor_agora()` e `pode_publicar_fora_grupo()`, categorias LUP, bucket
`marketplace-photos` e respetivas policies de Storage. Existem profiles com
data_nascimento, marketplace_ads (incluindo module=lup), marketplace_photos,
categories, municipios, social_posts e RLS de anúncios/fotos. As policies de
anúncios ainda permitem escrita direta; é necessário alinhar com RPC-only
para que um teste positivo tenha significado.

## Pacote proposto, ainda NÃO aplicado

1. Preparar dependências reais através de
   `supabase/migrations/20260912210000_adesoes_v001.sql`: seis tabelas da camada
   de adesões, configuração, enums, funções, triggers/RLS/grants. Não usar os
   helpers simulados de `tests/lup/rpc-fixture.sql` neste E2E.
2. Preparar a política de menoridade da migration
   `20260912230000_minors_policy_rgpd.sql` e aplicar imediatamente a correção
   `20260913050000_fix_e_menor_agora_tipo_data.sql`. O corpo antigo contém o
   bug integer/interval documentado; nunca testar entre esses dois passos.
   O helper pode_publicar_fora_grupo depende da tabela real adesoes.
3. Alinhar grants/policies de anúncios com
   `20260913180000_fechar_bypass_marketplace_ads.sql`: remover as policies
   permissivas antigas indicadas nesse ficheiro, repor leitura do autor e
   revogar INSERT/UPDATE/DELETE/TRUNCATE de authenticated. Afeta a tabela
   comum **apenas no ambiente local**, sem modificar código dos outros módulos.
4. Aplicar **exatamente**
   `supabase/migrations/20260913230000_lup_rpc_idempotente.sql`:
   coluna nullable public.marketplace_ads.lup_request_id, índice único parcial
   por autor/chave para module=lup, função public.lup_ad_guardar(jsonb,uuid,integer).
   CREATE FUNCTION, não substitui RPC existente; RPCs genéricas preservadas.
   Retorno TABLE(ad_id integer,created boolean). SECURITY DEFINER, search_path
   public,pg_temp; EXECUTE negado a PUBLIC/anon e concedido a authenticated.
   Não desativa RLS nem volta a conceder DML direto.
5. Povoar exclusivamente dados de teste: três categorias LUP, contas adultas
   descartáveis via Auth real e perfis associados; criar bucket
   marketplace-photos com regras de tamanho/MIME e policies de leitura pública
   e upload pelo dono do anúncio (prefixo do caminho = ad_id). Estas regras
   serão identificadas como preparação local, não como prova das policies remotas.
6. Servir Next.js com configuração explicitamente local. Testar pelo browser
   login, criar, editar, duplicação/retry, erros, ownership e imagens; consultar
   as linhas e objetos criados. Sem mocks na cadeia principal.

Rever precondições e conflitos de objetos antes de cada ficheiro; não executar
`db push` global, não aplicar as migrations herdadas de Empregos e não substituir
ficheiros de ambiente existentes.

## Risco, reversibilidade e recuperação

Migration LUP é aditiva e transacional, mas usa lock de ALTER TABLE e criação
normal de índice. Helpers/segurança anteriores também mudam permissões do
schema local. A preparação de Adesões é mais ampla do que uma só função;
não deve ser disfarçada de simples aplicação da migration LUP.

Backup completo local criado com pg_dump -Fc, código 0, 1 344 825 bytes:
`outputs/20260913-195222-lup-local-before-integration.dump` (permissões 0600).
Comando, stderr, código e SHA256 em
`outputs/20260913-195222-lup-local-backup.txt`.
O ficheiro vazio da tentativa bloqueada às 19:52:00 **não é backup válido**.
Não foi feito ensaio de restauro. O dump preserva a BD, não os bytes dos buckets
Storage existentes; estes não serão alterados. Só se criará o bucket novo de teste.

Recuperação recomendada: restaurar o dump numa nova BD local de recuperação,
validar e decidir a reposição; não fazer reset/drop automático da BD existente.
O código tem ponto de referência 6593ab6 mais alterações locais preservadas;
este commit não contém as alterações não commitadas.

## Upload/BD: diagnóstico estático, ainda sem teste de falhas real

A ordem atual é RPC/gravação do anúncio → upload Storage → INSERT marketplace_photos.
- Se a RPC falhar, não há upload.
- Se anúncio gravar e upload falhar, continua para o resultado positivo; anúncio
  pode ficar sem fotografia. Retry de criação devolve o anúncio já existente
  sem repetir uploads.
- Se upload funcionar e INSERT dos metadados falhar, pode ficar objeto órfão.
  Não há remoção compensatória nesse caminho.
- Sem transação conjunta; não equivale a bypass de RPC-only. A gravidade/aceitação
  tem de ser avaliada pelos testes reais de falha; ainda não é critério fechado.

## Estado e próximo passo

**Bloqueio de autorização**, não falha técnica nova do LUP. Nenhum E2E real nem
nova execução das suites antigas: repeti-las agora não resolve a falta de
preparação do alvo. Nova RPC não publicada no stack local existente nesta fase.

Autorizar a preparação descrita do Supabase local e a execução E2E, ou indicar
um ambiente alternativo comprovadamente não produtivo. Até lá:
**LUP concluído como RPC-only: NÃO; padrão aprovado para os outros módulos: NÃO.**

Outputs de inspeção: `20260913-195103-010972-lup-e2e-context.txt`,
`20260913-195124-372642-lup-integration-dependencies.txt`, logs de backup acima.
