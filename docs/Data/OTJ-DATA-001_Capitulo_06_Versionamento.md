# OTJ-DATA-001 --- Modelo de Dados Completo

# Capítulo 6 --- Versionamento

## 6.1 Finalidade

Este capítulo estabelece os princípios para o versionamento do modelo de
dados do Projeto O Tio do Joca. O objetivo é permitir a evolução
controlada da estrutura da base de dados, preservando a integridade da
informação e a compatibilidade entre versões.

## 6.2 Objetivos

O versionamento deverá:

-   controlar alterações ao esquema de dados;
-   permitir migrações seguras;
-   preservar compatibilidade sempre que possível;
-   documentar a evolução do modelo;
-   facilitar recuperação em caso de erro.

## 6.3 Versionamento do Esquema

Cada alteração estrutural deverá originar uma nova versão do modelo de
dados, devidamente identificada e documentada.

As versões deverão incluir descrição das alterações, data de entrada em
vigor e respetivas migrações.

## 6.4 Migrações

As migrações deverão ser:

-   repetíveis;
-   controladas;
-   reversíveis sempre que tecnicamente possível;
-   testadas antes da aplicação em produção.

## 6.5 Compatibilidade

Sempre que possível, as alterações deverão manter compatibilidade com
versões anteriores durante um período de transição, reduzindo o impacto
sobre os diferentes módulos do ecossistema.

## 6.6 Histórico

O histórico do modelo de dados deverá conservar o registo das versões,
alterações efetuadas, responsáveis e fundamentação técnica.

## 6.7 Síntese

Um processo de versionamento estruturado garante a evolução sustentável
do modelo de dados, permitindo ao Projeto O Tio do Joca crescer de forma
segura, previsível e documentada.

------------------------------------------------------------------------

**Documento:** OTJ-DATA-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 6 --- Versionamento

**Próximo capítulo:** Capítulo 7 --- Evolução do Modelo de Dados
