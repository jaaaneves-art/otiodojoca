# OTJ-API-001 --- Especificação das APIs

# Capítulo 3 --- Autenticação e Autorização

## 3.1 Finalidade

Este capítulo define os princípios de autenticação e autorização
aplicáveis às APIs do Projeto O Tio do Joca, garantindo que apenas
utilizadores e serviços devidamente identificados possam aceder aos
recursos disponibilizados.

## 3.2 Objetivos

O modelo deverá:

-   identificar de forma segura utilizadores e serviços;
-   controlar o acesso aos recursos;
-   proteger dados sensíveis;
-   permitir auditoria das operações;
-   suportar diferentes níveis de permissão.

## 3.3 Autenticação

A autenticação deverá assentar em mecanismos seguros, recorrendo, sempre
que possível, a normas amplamente adotadas. A gestão de sessões e
credenciais deverá minimizar riscos de utilização indevida.

## 3.4 Autorização

O acesso aos recursos deverá depender dos papéis e permissões atribuídos
a cada utilizador ou serviço, aplicando o princípio do menor privilégio.

## 3.5 Tokens e Sessões

Os mecanismos de autenticação deverão utilizar tokens ou credenciais
equivalentes com validade controlada, renovação segura e possibilidade
de revogação.

## 3.6 Auditoria

Os acessos relevantes às APIs deverão poder ser registados para efeitos
de auditoria, monitorização e investigação de incidentes, respeitando a
legislação aplicável.

## 3.7 Síntese

Uma arquitetura sólida de autenticação e autorização constitui um
elemento essencial para a segurança, fiabilidade e integridade das APIs
do Projeto O Tio do Joca.

------------------------------------------------------------------------

**Documento:** OTJ-API-001

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 3 --- Autenticação e Autorização

**Próximo capítulo:** Capítulo 4 --- Endpoints
