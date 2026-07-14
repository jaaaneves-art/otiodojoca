# ADR-010 --- Estratégia de API

## Estado

Aceite

## Data

2026-07-14

## Contexto

A plataforma OTJ disponibiliza serviços ao frontend e a futuras
integrações externas. É necessário definir princípios consistentes para
o desenho, segurança, evolução e manutenção das APIs.

## Problema

Definir uma estratégia de API que assegure:

-   Consistência
-   Segurança
-   Versionamento
-   Escalabilidade
-   Facilidade de integração

## Alternativas Consideradas

### APIs REST

-   Simples de compreender.
-   Elevada compatibilidade.
-   Excelente suporte no ecossistema web.

### GraphQL

-   Flexibilidade elevada.
-   Maior complexidade de implementação e monitorização.

## Decisão

Adotar **APIs REST** como padrão principal da plataforma, utilizando
HTTPS, autenticação baseada em JWT e versionamento quando necessário.

## Justificação

As APIs REST são amplamente suportadas, integram-se facilmente com
Next.js e Supabase e simplificam a manutenção e a integração com
serviços externos.

## Consequências

### Positivas

-   Elevada interoperabilidade.
-   Facilidade de documentação.
-   Integração simples com clientes web e móveis.
-   Curva de aprendizagem reduzida.

### Negativas

-   Alguns cenários poderão exigir múltiplos pedidos.
-   Evolução funcional requer gestão cuidadosa do versionamento.

## Impacto

Afeta diretamente:

-   Backend
-   Frontend
-   API
-   Security
-   DevOps
-   Integrações externas

## Referências

-   API
-   Backend
-   Frontend
-   Security
-   ADR-001
-   ADR-003
-   ADR-005

## Histórico de Revisões

  Versão   Data         Alteração
  -------- ------------ ---------------------------------------
  1.0      2026-07-14   Registo da estratégia oficial de API.
