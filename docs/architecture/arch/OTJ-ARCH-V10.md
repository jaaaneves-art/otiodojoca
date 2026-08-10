# OTJ-ARCH-V10 --- Convenções Técnicas

**Coleção:** OTJ-ARCH --- Arquitetura do Projeto O Tio do Joca\
**Volume:** V10\
**Estado:** Aprovado\
**Versão:** 1.0

# 1. Objetivo

Definir as convenções técnicas comuns que deverão ser seguidas durante o
desenvolvimento do ecossistema OTJ.

# 2. Nomenclatura

-   Utilizar nomes consistentes e descritivos.
-   Tabelas em plural.
-   Chaves primárias com o campo `id`.
-   Chaves estrangeiras com o padrão `<entidade>_id`.

# 3. Base de Dados

-   PostgreSQL como motor de base de dados.
-   Supabase como plataforma principal.
-   Integridade referencial obrigatória.
-   Migrações versionadas.

# 4. SQL

-   Evitar duplicação de estruturas.
-   Utilizar índices quando justificado.
-   Preferir normalização sem comprometer o desempenho.
-   Utilizar transações para operações críticas.

# 5. Código

-   Organização modular.
-   Reutilização de componentes.
-   Separação entre lógica de negócio e interface.
-   Documentação obrigatória para APIs e funções públicas.

# 6. Controlo de Versões

-   Utilização de Git.
-   Commits descritivos.
-   Revisão de alterações antes da integração.

# 7. Qualidade

-   Testes sempre que possível.
-   Revisão de código.
-   Registo de decisões arquitetónicas.
-   Documentação atualizada.

# 8. Conclusão

Estas convenções asseguram consistência técnica, facilitam a colaboração
e reduzem o custo de manutenção da plataforma ao longo do tempo.

## Relação com os restantes volumes

-   V09 --- Segurança e Administração
-   V11 --- Implementação

## Histórico

Versão 1.0 --- Primeira edição oficial.
