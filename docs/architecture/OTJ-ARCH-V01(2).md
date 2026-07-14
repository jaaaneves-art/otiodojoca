# OTJ-ARCH-V01 --- Filosofia e Arquitetura

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V01\
**Estado:** Em elaboração\
**Versão:** 1.0

# 1. Objetivo

Definir a filosofia, os princípios orientadores e a arquitetura de
referência do Projeto O Tio do Joca (OTJ).

# 2. Âmbito

Aplica-se a todo o ecossistema OTJ: Portal, Fórum, Biblioteca,
Almanaque, Enciclopédia, Feira, Agenda, Administração, APIs, PWA e
futuras aplicações.

# 3. Missão

Preservar, organizar, produzir e divulgar conhecimento sobre Portugal
através de uma plataforma digital integrada.

# 4. Visão

Ser uma plataforma de referência dedicada ao património português,
construída para evoluir durante muitos anos.

# 5. Princípios Fundamentais

-   Preservação do património
-   Rigor da informação
-   Simplicidade
-   Reutilização
-   Modularidade
-   Escalabilidade
-   Segurança
-   Acessibilidade
-   Transparência
-   Sustentabilidade

# 6. Princípio Arquitetónico Fundamental

> Cada facto existe apenas uma vez; tudo o resto são diferentes formas
> de o relacionar, apresentar e reutilizar.

# 7. Ecossistema

Os módulos não são sistemas isolados. Todos partilham uma arquitetura
comum, recursos reutilizáveis e uma base de conhecimento única.

# 8. Arquitetura em Camadas

1.  Identidade
2.  Conhecimento
3.  Classificação
4.  Território
5.  Recursos Partilhados
6.  Conteúdos
7.  Interação
8.  Administração

# 9. Responsabilidades das Camadas

## Identidade

Autenticação, perfis, permissões e sessões.

## Conhecimento

Entidades, relações e modelo do domínio.

## Classificação

Taxonomias, categorias e etiquetas.

## Território

Localizações, moradas e enquadramento geográfico.

## Recursos Partilhados

Ficheiros, contactos, fontes, ligações externas e outros recursos
comuns.

## Conteúdos

Artigos, documentos, notícias, eventos, receitas e restantes conteúdos.

## Interação

Fórum, comentários, mensagens, notificações e favoritos.

## Administração

Auditoria, moderação, configurações e monitorização.

# 10. Objetivos da Arquitetura

-   Evitar duplicação de informação.
-   Reutilizar componentes sempre que possível.
-   Facilitar a evolução da plataforma.
-   Garantir consistência dos dados.
-   Permitir crescimento modular.

# 11. Decisões Arquitetónicas

-   Uma única origem para cada dado.
-   Recursos comuns reutilizados por todos os módulos.
-   Separação entre conhecimento e funcionalidades.
-   Arquitetura orientada ao domínio.
-   Evolução por módulos sem comprometer o núcleo.

# 12. Conclusão

Este volume estabelece os princípios fundamentais que orientam todo o
desenvolvimento do OTJ. Os volumes seguintes detalharão o modelo do
domínio, entidades, taxonomias, conteúdos, segurança e implementação.

**Estado:** Em elaboração. Aproximadamente 40% concluído.
