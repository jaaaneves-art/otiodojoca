# OTJ-API-001 --- Especificação das APIs

# Capítulo 6 --- Gestão de Erros

## 6.1 Finalidade

Este capítulo define os princípios para a gestão de erros nas APIs do
Projeto O Tio do Joca, assegurando respostas previsíveis, consistentes e
úteis para utilizadores, programadores e sistemas integrados.

## 6.2 Objetivos

A gestão de erros deverá:

-   comunicar claramente a causa do problema;
-   facilitar o diagnóstico;
-   preservar a segurança da plataforma;
-   manter consistência entre serviços;
-   apoiar a monitorização e auditoria.

## 6.3 Códigos de Resposta

As APIs deverão utilizar códigos de estado adequados, distinguindo
situações de sucesso, erro do cliente, erro do servidor e outras
condições relevantes, de acordo com as boas práticas dos protocolos
utilizados.

## 6.4 Estrutura das Mensagens

As respostas de erro deverão incluir, quando aplicável:

-   código do erro;
-   descrição legível;
-   identificador da ocorrência;
-   detalhes técnicos apropriados;
-   sugestões para resolução, quando possível.

## 6.5 Registo e Monitorização

Os erros relevantes deverão ser registados para efeitos de auditoria,
análise, monitorização e melhoria contínua, respeitando os requisitos de
proteção de dados.

## 6.6 Evolução

Novos tipos de erro poderão ser introduzidos de forma compatível,
mantendo documentação atualizada e evitando alterações disruptivas nas
integrações existentes.

## 6.7 Síntese

Uma gestão de erros uniforme aumenta a fiabilidade das APIs, simplifica
a integração entre sistemas e contribui para a qualidade global do
Projeto O Tio do Joca.

------------------------------------------------------------------------

**Documento:** OTJ-API-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 6 --- Gestão de Erros

**Próximo capítulo:** Capítulo 7 --- Versionamento das APIs
