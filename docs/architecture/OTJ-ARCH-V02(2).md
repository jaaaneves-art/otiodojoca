# OTJ-ARCH-V02 --- Modelo do Domínio

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V02\
**Estado:** Aprovado\
**Versão:** 1.0

# 1. Objetivo

Definir o modelo do domínio do OTJ, identificando os objetos
fundamentais do negócio e as relações entre eles, independentemente da
tecnologia utilizada.

# 2. Princípios do Modelo do Domínio

-   O domínio representa a realidade do projeto.
-   A tecnologia implementa o domínio, não o define.
-   Cada objeto tem uma responsabilidade única.
-   As relações são preferidas à duplicação de dados.

# 3. Objetos Fundamentais

-   Utilizador
-   Perfil
-   Entidade
-   Organização
-   Localização
-   Conteúdo
-   Taxonomia
-   Recurso
-   Relação

# 4. Responsabilidades

## Utilizador

Participa na plataforma, cria conteúdos e interage com a comunidade.

## Perfil

Representa a identidade pública do utilizador.

## Entidade

Elemento central do conhecimento. Pode representar pessoas, espécies,
produtos, monumentos, tradições, documentos ou qualquer outro conceito
permanente.

## Organização

Especialização de entidade que representa instituições públicas ou
privadas.

## Localização

Contexto geográfico associado a entidades, conteúdos e organizações.

## Conteúdo

Informação produzida sobre entidades.

## Taxonomia

Sistema comum de classificação.

## Recurso

Objetos reutilizáveis como ficheiros, contactos e fontes.

## Relação

Ligação explícita entre objetos do domínio.

# 5. Regras Gerais

-   Um objeto pode relacionar-se com vários outros objetos.
-   As relações devem ser explícitas.
-   A reutilização é obrigatória sempre que exista um objeto
    equivalente.
-   O domínio deve permanecer estável ao longo da evolução da
    plataforma.

# 6. Benefícios

-   Arquitetura consistente.
-   Evolução modular.
-   Integração entre módulos.
-   Pesquisa global.
-   Facilidade de manutenção.
-   Escalabilidade.

# 7. Conclusão

O modelo do domínio constitui a base conceptual do OTJ. Todos os módulos
deverão reutilizar estes objetos, acrescentando apenas as regras
específicas de cada área funcional.

## Relação com os restantes volumes

-   V01 --- Filosofia e Arquitetura
-   V03 --- Entidades e Relações
-   V04 --- Taxonomias
-   V05 --- Localizações e Organizações

## Histórico

Versão 1.0 --- Primeira edição oficial.
