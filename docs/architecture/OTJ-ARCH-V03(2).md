# OTJ-ARCH-V03 --- Entidades e Relações

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V03\
**Estado:** Aprovado\
**Versão:** 1.0

# 1. Objetivo

Definir o modelo de Entidades e Relações que constitui o núcleo do
conhecimento do OTJ.

# 2. Conceito de Entidade

Uma entidade representa qualquer elemento permanente sobre o qual a
plataforma armazena conhecimento.

Exemplos: - Pessoa - Organização - Planta - Animal - Produto -
Monumento - Receita - Documento - Evento - Tradição

# 3. Conceito de Relação

Uma relação representa uma ligação explícita entre duas entidades.

Exemplos: - pertence a - localizado em - produzido por - autor de -
organizado por - relacionado com

# 4. Regras Fundamentais

-   Cada entidade possui uma identidade única.
-   Uma entidade pode participar em múltiplas relações.
-   As relações possuem um tipo definido.
-   O conhecimento é construído através das relações e não pela
    duplicação de dados.

# 5. Cardinalidades

O modelo suporta: - 1:1 - 1:N - N:N

As relações N:N deverão ser implementadas através de tabelas de
associação.

# 6. Integridade

Todas as relações deverão: - referenciar entidades válidas; - manter
integridade referencial; - permitir evolução sem alterar o modelo base.

# 7. Benefícios

-   Base de conhecimento unificada.
-   Elevada reutilização.
-   Pesquisa inteligente.
-   Evolução modular.
-   Redução de redundâncias.

# 8. Conclusão

O modelo de Entidades e Relações constitui o centro conceptual da
arquitetura do OTJ. Todos os restantes volumes reutilizam este modelo
como base para a organização e interligação do conhecimento.

## Relação com os restantes volumes

-   V02 --- Modelo do Domínio
-   V04 --- Taxonomias
-   V05 --- Localizações e Organizações
-   V06 --- Conteúdos

## Histórico

Versão 1.0 --- Primeira edição oficial.
