# OTJ-SQL-V16 — Views

## Objetivo

Este documento define a estratégia de utilização de **Views** na Base de Dados da plataforma **O Tio do Joca (OTJ)**.

As *Views* permitem disponibilizar informação estruturada e reutilizável, simplificando consultas complexas, promovendo a consistência dos dados e melhorando a organização da camada de acesso à Base de Dados.

---

# Princípios

A implementação das *Views* deverá garantir:

- Simplificação de consultas complexas
- Reutilização de lógica SQL
- Consistência da informação
- Segurança no acesso aos dados
- Facilidade de manutenção
- Escalabilidade

---

# Finalidade

As *Views* poderão ser utilizadas para:

- Agregar informação de várias tabelas
- Apresentar dados prontos para consumo pela aplicação
- Simplificar relatórios
- Apoiar pesquisas
- Disponibilizar estatísticas
- Restringir o acesso direto às tabelas

---

# Tipos de Views

A Base de Dados poderá utilizar:

- Views simples
- Views com junções (*JOIN*)
- Views agregadas
- Views de apoio à pesquisa
- Views para relatórios
- Materialized Views (quando justificável)

---

# Áreas de Aplicação

As *Views* poderão ser utilizadas em módulos como:

- Agricultura
- Pecuária
- Mercado
- Fórum
- Eventos
- Utilizadores
- Estatísticas
- Administração
- Relatórios

---

# Segurança

Sempre que necessário, as *Views* poderão expor apenas os campos autorizados, ocultando informação sensível existente nas tabelas base.

Desta forma, constituem também um mecanismo complementar de segurança.

---

# Desempenho

A utilização de *Views* deverá considerar:

- Número de tabelas envolvidas
- Complexidade das consultas
- Frequência de utilização
- Necessidade de índices de apoio
- Utilização de Materialized Views quando adequado

---

# Manutenção

As *Views* deverão ser:

- Documentadas
- Versionadas
- Validadas após alterações estruturais
- Mantidas consistentes com a evolução da Base de Dados

---

# Escalabilidade

A arquitetura deverá permitir a criação de novas *Views* sem impacto significativo na estrutura existente, facilitando a evolução da plataforma e o desenvolvimento de novas funcionalidades.

---

# Conclusão

A utilização de *Views* contribui para uma Base de Dados mais organizada, reutilizável e eficiente, simplificando o acesso à informação e reduzindo a complexidade das consultas utilizadas pela plataforma OTJ.