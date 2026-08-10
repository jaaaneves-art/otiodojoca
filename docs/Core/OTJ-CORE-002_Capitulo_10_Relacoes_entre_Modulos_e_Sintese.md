# OTJ-CORE-002 --- Modelo Conceptual dos Módulos do Ecossistema

# Capítulo 10 --- Relações entre Módulos e Síntese do Modelo Conceptual

## 10.1 Finalidade

Este capítulo consolida o modelo conceptual dos módulos do ecossistema
do Projeto O Tio do Joca, descrevendo as relações entre os diferentes
componentes e estabelecendo os princípios que garantem uma evolução
coerente da plataforma.

## 10.2 Relação entre Módulos

Os módulos não deverão funcionar como aplicações isoladas. Cada um
possui responsabilidades próprias, mas integra-se num ecossistema comum
através dos serviços transversais.

``` text
                 Portal Institucional
                        │
 ┌──────────────┬────────┼────────┬──────────────┐
 │              │        │        │              │
 ▼              ▼        ▼        ▼              ▼
Fórum      Biblioteca  Almanaque Enciclopédia  Feira
 \              |          |          |         /
  \_____________|__________|__________|________/
                 │
                 ▼
        Serviços Transversais
                 │
                 ▼
       Área de Administração
```

## 10.3 Fluxos de Informação

A informação deverá ser criada na origem mais adequada e reutilizada
pelos restantes módulos sempre que necessário.

Exemplos:

-   perfis são partilhados por todo o ecossistema;
-   a pesquisa consulta todos os módulos;
-   notificações seguem um modelo comum;
-   documentos podem ser referenciados entre módulos sem duplicação.

## 10.4 Dependências

Os módulos deverão minimizar dependências diretas entre si,
privilegiando a utilização dos serviços transversais e interfaces bem
definidas.

## 10.5 Evolução do Ecossistema

A integração de novos módulos deverá:

-   respeitar a arquitetura conceptual;
-   reutilizar serviços existentes;
-   preservar a experiência uniforme do utilizador;
-   evitar redundâncias funcionais.

## 10.6 Síntese Final

O modelo conceptual define uma plataforma modular, integrada e
evolutiva, preparada para crescer sem perder identidade.

Cada módulo reforça os restantes, contribuindo para um único objetivo:
preservar, organizar e divulgar o património português através de um
ecossistema digital coerente.

------------------------------------------------------------------------

**Documento:** OTJ-CORE-002

**Estado:** Primeira versão concluída

**Capítulo concluído:** Capítulo 10 --- Relações entre Módulos e Síntese
do Modelo Conceptual

**Próximo documento recomendado:** OTJ-CORE-003 --- Modelo Conceptual da
Informação
