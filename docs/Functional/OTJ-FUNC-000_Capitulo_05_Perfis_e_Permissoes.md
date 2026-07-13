# OTJ-FUNC-000 --- Norma para Especificações Funcionais

# Capítulo 5 --- Perfis e Permissões

## 5.1 Finalidade

Este capítulo estabelece a forma normalizada de documentar perfis de
utilizador, papéis e permissões nas Especificações Funcionais do Projeto
O Tio do Joca.

## 5.2 Objetivos

A documentação de perfis e permissões deverá:

-   identificar os diferentes tipos de utilizador;
-   definir responsabilidades;
-   especificar permissões de acesso;
-   garantir coerência entre módulos.

## 5.3 Perfis

Cada especificação deverá identificar, sempre que aplicável:

-   Visitante;
-   Utilizador Registado;
-   Moderador;
-   Editor;
-   Administrador;
-   Gestor Institucional;
-   Outros perfis específicos do módulo.

## 5.4 Permissões

Para cada perfil deverão ser documentadas as operações permitidas, tais
como:

-   consultar;
-   criar;
-   editar;
-   eliminar;
-   aprovar;
-   moderar;
-   administrar.

## 5.5 Matriz de Acessos

Sempre que possível deverá ser incluída uma matriz que relacione perfis
com permissões, facilitando a implementação e os testes.

## 5.6 Princípio do Menor Privilégio

As permissões deverão respeitar o princípio do menor privilégio,
atribuindo apenas os acessos estritamente necessários ao desempenho de
cada função.

## 5.7 Rastreabilidade

As permissões documentadas deverão poder ser relacionadas com regras de
negócio, casos de utilização e mecanismos de autenticação e autorização.

## 5.8 Síntese

Uma definição clara de perfis e permissões aumenta a segurança,
simplifica a implementação e assegura uma gestão consistente dos
acessos.

------------------------------------------------------------------------

**Documento:** OTJ-FUNC-000

**Estado:** Em elaboração

**Capítulo concluído:** Capítulo 5 --- Perfis e Permissões

**Próximo capítulo:** Capítulo 6 --- Fluxos Funcionais
