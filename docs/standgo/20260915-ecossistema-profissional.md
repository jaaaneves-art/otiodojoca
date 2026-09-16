# StandGo — ecossistema profissional

## Decisão e âmbito

Revisão da migration pendente `20260915193000_standgo_empresas_v1.sql`, antes de aplicação. Nenhuma migration remota foi executada. Esta entrega prepara a base de dados; a integração visual da pesquisa e da ficha StandGo fica para a fase de aplicação.

- `entidades` continua a identidade única: nome, slug, descrição, fotografias, contactos públicos e localização.
- `entidade_empresas` guarda a extensão empresarial transversal. `standgo_empresas.entidade_id` referencia essa extensão, cuja chave referencia `entidades`.
- `standgo_empresas` representa apenas presença e estado no módulo.
- `standgo_atividades` contém 170 atividades/serviços, com código estável, nome, grupos e sinónimos. Uma entrada comum a vários grupos é reutilizada. Novas profissões entram por INSERT, sem alterar estrutura.
- `standgo_empresa_atividades` associa várias atividades a várias empresas. A chave composta evita duplicados; o índice inverso suporta pesquisa por atividade.

`entidade_atividades` existente contém CAE/descrições livres por entidade, sem catálogo nem identidade partilhada de serviço. Mantém essa finalidade transversal. `categorias_entidade` classifica a entidade e não substitui a associação de múltiplos serviços. O catálogo StandGo é uma extensão vertical, não uma segunda identidade empresarial.

Calibragem de pneus, equilibragem de rodas e alinhamento de direção têm entradas independentes. Grupos abrangem comércio, aluguer/transporte, mecânica, chapa/pintura, vidros/ADAS, pneus, peças, sucatas, assistência, lavagem/detalhe, estofos, eletrónica e outros profissionais.

## Compatibilidade e autorização

Os quatro booleanos estavam apenas no ficheiro pendente, sem consumidores encontrados no código. Foram substituídos antes da primeira aplicação. Esta revisão não é uma migration de conversão para uma base onde a versão anterior já tenha sido aplicada; nesse caso é necessária uma migration aditiva com backfill explícito, conservando os dados antigos.

`profiles.is_stand_automovel`, anúncios existentes e `author_id` mantêm-se. A nova associação `marketplace_ads.entidade_id` é opcional; NULL preserva os anúncios particulares/legados. Não se infere nem cria uma empresa a partir de um perfil ou anúncio. Peças, veículos e salvados concretos são conteúdos da empresa, nunca novas entidades.

Um trigger exige responsabilidade ativa e presença StandGo ativa ao associar um anúncio de viaturas à empresa. Atualizações de anúncios sem alteração dessa associação continuam possíveis. A função não substitui as políticas de autorização dos anúncios. Escritas de backend em nome de empresa também precisam do contexto do responsável; não há exceção implícita por service role.

Leitura pública da presença e das associações exige empresa ativa e entidade publicada. Responsáveis podem consultar a própria presença não pública. Catálogo público mostra apenas entradas ativas. Gestão do catálogo e associações fica no backend autorizado; não há políticas de escrita direta para anon/authenticated nesta fase. Não se deve dar ao utilizador controlo direto do estado de verificação.

## Pesquisa e localização

Resolver texto para os códigos do catálogo usando nome e sinónimos; combinar a associação com `entidades.freguesia_id` e a hierarquia territorial existente. Os índices de freguesia/localização existentes são reutilizados. `entidade_empresas.pais_codigo` permite filtro por país; `entidades.localizacao_id` mantém a ligação à infraestrutura geográfica. A obrigatoriedade de freguesia identificada nesta auditoria foi tratada posteriormente pela migration `20260915200000_entidades_diaspora_privacidade_v1.sql`: permite freguesia ausente e acrescenta região/localidade sem inventar freguesias. Ver [V1 Eventos & Festas](../eventos-festas/V1-ECOSSISTEMA-PROFISSIONAL.md) para a ordem de aplicação e os limites internacionais.

Exemplo de composição da pesquisa (parâmetros tipados pelo backend):

```sql
SELECT e.id, e.slug, e.nome, e.descricao, e.freguesia_id, e.localizacao_id
FROM public.entidades e
JOIN public.standgo_empresas se ON se.entidade_id = e.id
JOIN public.entidade_empresas ee ON ee.entidade_id = e.id
WHERE e.estado = 'publicado' AND se.estado = 'ativo'
  AND (:freguesia_id IS NULL OR e.freguesia_id = :freguesia_id)
  AND (:pais_codigo IS NULL OR ee.pais_codigo = :pais_codigo)
  AND EXISTS (
    SELECT 1 FROM public.standgo_empresa_atividades ea
    JOIN public.standgo_atividades a ON a.id = ea.atividade_id
    WHERE ea.entidade_id = e.id AND a.ativo AND a.codigo = :atividade_codigo
  );
```

Área de cobertura de reboques/assistência é diferente da sede: uma futura relação de áreas servidas deve reutilizar IDs geográficos, sem substituir a localização da entidade. Pesquisa por distância, cobertura, marcas (por exemplo BMW) e stock de peças exige a respetiva camada de pesquisa; o catálogo não afirma que uma empresa tem uma peça concreta disponível.

## Página pública e outros módulos

Reutilizar `/entidades/[slug]` e os dados públicos existentes. A página já integra contactos, descrição, localização e `horarios`/`horarios_excecoes`. A integração StandGo deverá acrescentar fotografias/logótipo, atividades/serviços, `verificada` e anúncios ativos visíveis pelas políticas do marketplace, filtrados por `entidade_id`.

Selecionar explicitamente campos públicos; nunca devolver responsáveis, IDs de perfis, identificação fiscal ou registos empresariais completos à ficha pública. A UI StandGo, seleção de atividades e pesquisa ainda não estão ligadas a estas tabelas pendentes.

Eventos & Festas pode ativar a sua extensão para o mesmo `entidade_id`; não copiar a empresa nem usar `ref_tabela/ref_id` como limite de pertença a um único módulo. Cada extensão gere serviços próprios; a identidade, responsáveis e contactos continuam transversais.

## Validação

`tests/standgo/empresas-schema.sql` usa uma fixture mínima numa base PostgreSQL descartável. Verifica execução das duas migrations, catálogo, associação N:N, unicidade, RLS pública, manutenção do anúncio legado e autorização ao associar anúncios. Não representa um replay completo do schema de produção; esse replay e a integração visual são verificações posteriores, antes de qualquer deploy.
