# OTJ-SECURITY --- Segurança da Plataforma

**Projeto:** O Tio do Joca (OTJ)\
**Documento:** OTJ-SECURITY\
**Área:** Segurança / Privacidade / Conformidade\
**Estado:** Documento de referência

------------------------------------------------------------------------

# 1. Introdução

A segurança é um dos pilares da plataforma **O Tio do Joca (OTJ)**. Este
documento apresenta uma visão global da estratégia de segurança adotada,
servindo como ponto de entrada para a restante documentação desta área.

------------------------------------------------------------------------

# 2. Objetivos

A estratégia de segurança pretende garantir:

-   Confidencialidade dos dados;
-   Integridade da informação;
-   Disponibilidade dos serviços;
-   Privacidade dos utilizadores;
-   Conformidade legal e regulamentar;
-   Rastreabilidade e auditoria.

------------------------------------------------------------------------

# 3. Áreas de Segurança

-   Autenticação
-   Autorização
-   Proteção de dados
-   Gestão de identidades
-   Registo de auditoria
-   Gestão de riscos
-   Resposta a incidentes
-   Conformidade

------------------------------------------------------------------------

# 4. Tecnologias

-   Supabase Auth
-   PostgreSQL
-   Row Level Security (RLS)
-   HTTPS/TLS
-   JWT
-   Políticas de acesso baseadas em perfis

------------------------------------------------------------------------

# 5. Princípios

-   Menor privilégio
-   Defesa em profundidade
-   Segurança por defeito
-   Privacidade desde a conceção (Privacy by Design)
-   Validação de todas as entradas
-   Registo e monitorização de eventos relevantes

------------------------------------------------------------------------

# 6. Integração

A segurança está presente em todas as camadas da plataforma:

``` text
Frontend
    │
API
    │
Backend
    │
Base de Dados
```

------------------------------------------------------------------------

# 7. Coleção de Documentos

A documentação detalhada encontra-se na coleção de documentos de
Segurança e Privacidade e no material de referência disponível na pasta
`Guide/`.

------------------------------------------------------------------------

# 8. Objetivo do Documento

Este documento fornece uma visão global da arquitetura de segurança da
plataforma OTJ e serve como documento principal da área de Segurança.
