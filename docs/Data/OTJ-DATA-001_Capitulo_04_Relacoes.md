# OTJ-DATA-001 --- Modelo de Dados Completo

# Capítulo 4 --- Relações

## 4.1 Finalidade

Este capítulo define as relações existentes entre as entidades do modelo
de dados do Projeto O Tio do Joca. As relações asseguram a ligação
lógica entre os diferentes elementos do ecossistema, permitindo uma
estrutura coerente e reutilizável.

## 4.2 Objetivos

As relações deverão:

-   representar corretamente as dependências entre entidades;
-   garantir integridade referencial;
-   evitar redundância de informação;
-   facilitar consultas e manutenção;
-   suportar a evolução do modelo.

## 4.3 Tipos de Relação

O modelo poderá utilizar:

-   relações um para um (1:1);
-   relações um para muitos (1:N);
-   relações muitos para muitos (N:N), através de entidades de
    associação.

A escolha deverá refletir a realidade funcional do domínio.

## 4.4 Relações Transversais

As entidades de utilizadores, conteúdos, categorias, etiquetas e
permissões poderão relacionar-se com vários módulos do ecossistema,
promovendo reutilização e consistência.

## 4.5 Integridade Referencial

Todas as relações deverão ser suportadas por chaves primárias e
estrangeiras adequadas, garantindo a consistência dos dados e evitando
referências inválidas.

## 4.6 Evolução

Novas relações poderão ser introduzidas de forma controlada, preservando
a compatibilidade com o modelo existente e documentando as alterações
efetuadas.

## 4.7 Síntese

As relações entre entidades constituem a estrutura que integra todo o
modelo de dados, assegurando coerência, rastreabilidade e reutilização
da informação em todo o Projeto O Tio do Joca.

------------------------------------------------------------------------

**Documento:** OTJ-DATA-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 4 --- Relações

**Próximo capítulo:** Capítulo 5 --- Regras de Integridade
