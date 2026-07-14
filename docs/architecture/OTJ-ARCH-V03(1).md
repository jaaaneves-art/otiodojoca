# OTJ-ARCH-V03 --- Entidades e Relações

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V03\
**Estado:** Em elaboração\
**Versão:** 1.0

# 1. Objetivo

Definir o modelo de entidades e relações que constitui o núcleo do
conhecimento do OTJ.

# 2. Entidades

Uma entidade representa qualquer elemento permanente sobre o qual o OTJ
armazena conhecimento.

Exemplos: - Pessoa - Organização - Planta - Animal - Produto -
Monumento - Evento - Receita - Documento - Tradição

# 3. Relações

As relações ligam entidades de forma explícita e possuem significado
próprio.

Exemplos: - pertence a - localizado em - autor de - organizado por -
produzido por - relacionado com

# 4. Cardinalidades

O modelo deverá suportar:

-   1:1
-   1:N
-   N:N

As relações N:N serão implementadas através de tabelas de associação.

# 5. Integridade

Todas as relações deverão:

-   referenciar entidades válidas;
-   possuir um tipo de relação definido;
-   permitir histórico quando necessário;
-   impedir referências inválidas.

# 6. Evolução

Novos tipos de entidades ou relações poderão ser adicionados sem alterar
a arquitetura base.

# 7. Benefícios

-   Eliminação de duplicação.
-   Rede de conhecimento consistente.
-   Pesquisa inteligente.
-   Elevada reutilização.
-   Crescimento modular.

# 8. Conclusão

O modelo de Entidades e Relações constitui o centro do conhecimento do
OTJ. Todos os restantes volumes da coleção reutilizam este modelo como
base conceptual.

## Relação com os restantes volumes

-   V02 --- Modelo do Domínio
-   V04 --- Taxonomias
-   V05 --- Localizações e Organizações
-   V06 --- Conteúdos

## Estado

Versão intermédia. Revisão final pendente.
