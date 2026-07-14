# OTJ-ARCH-V07 --- Módulos Funcionais

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V07\
**Estado:** Aprovado\
**Versão:** 1.0

# 1. Objetivo

Definir a arquitetura funcional dos módulos que compõem o ecossistema
OTJ.

# 2. Princípios

Todos os módulos deverão:

-   reutilizar os serviços comuns da plataforma;
-   respeitar o modelo do domínio;
-   evitar duplicação de dados;
-   comunicar através de interfaces bem definidas;
-   manter independência funcional.

# 3. Módulos

## Portal

Ponto de entrada da plataforma.

## Fórum

Discussão e partilha de conhecimento.

## Biblioteca

Gestão documental.

## Almanaque

Calendário agrícola, tradições e conhecimento sazonal.

## Enciclopédia

Conhecimento estruturado sobre entidades.

## Feira

Anúncios, produtos e serviços.

## Agenda

Eventos e atividades.

## Administração

Gestão global da plataforma.

# 4. Integração

Todos os módulos reutilizam:

-   Identidade
-   Entidades
-   Localizações
-   Taxonomias
-   Conteúdos
-   Recursos Partilhados

# 5. Benefícios

-   Modularidade
-   Reutilização
-   Evolução independente
-   Facilidade de manutenção
-   Consistência global

# 6. Conclusão

Os módulos funcionais representam diferentes perspetivas sobre a mesma
base de conhecimento e nunca sistemas isolados.

## Relação com os restantes volumes

-   V01 --- Filosofia e Arquitetura
-   V02 --- Modelo do Domínio
-   V06 --- Conteúdos
-   V08 --- Recursos Partilhados

## Histórico

Versão 1.0 --- Primeira edição oficial.
