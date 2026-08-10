# OTJ-SQL-V07 — Agricultura

## Objetivo

Este documento define a implementação SQL do módulo de Agricultura da plataforma **O Tio do Joca (OTJ)**.

Este módulo suporta toda a informação relacionada com culturas agrícolas, hortas, pomares, vinhas, olivais e restantes atividades agrícolas, permitindo o acompanhamento técnico e a gestão do conhecimento.

---

# Princípios

O módulo deverá garantir:

- Organização por culturas
- Reutilização da informação
- Integração com taxonomias
- Associação a localizações
- Escalabilidade
- Integridade dos dados

---

# Âmbito

O módulo poderá incluir, entre outros:

- Hortícolas
- Cereais
- Leguminosas
- Fruticultura
- Viticultura
- Olivicultura
- Plantas aromáticas
- Plantas medicinais
- Culturas industriais
- Culturas ornamentais

---

# Informação

Cada cultura poderá possuir:

- Nome
- Nome científico
- Categoria
- Descrição
- Épocas de cultivo
- Épocas de sementeira
- Épocas de plantação
- Colheita
- Rega
- Fertilização
- Podas
- Tratamentos
- Pragas
- Doenças
- Boas práticas agrícolas

---

# Relações

As culturas poderão estar relacionadas com:

- Taxonomias
- Localizações
- Utilizadores
- Explorações agrícolas
- Calendário agrícola
- Artigos
- Fotografias
- Vídeos
- Guias técnicos
- Checklists

---

# Calendário Agrícola

A estrutura deverá permitir associar tarefas agrícolas ao calendário, incluindo:

- Preparação do solo
- Sementeira
- Plantação
- Transplante
- Rega
- Fertilização
- Tratamentos fitossanitários
- Poda
- Colheita
- Conservação

---

# Checklists

O módulo deverá suportar listas de acompanhamento para cada cultura, permitindo ao utilizador registar a execução das diferentes tarefas ao longo do ciclo de cultivo.

---

# Pesquisa

As pesquisas poderão ser efetuadas por:

- Cultura
- Categoria
- Época
- Localização
- Tipo de cultivo
- Nome científico

---

# Integridade

A implementação deverá garantir:

- Integridade referencial
- Eliminação controlada
- Validação das relações
- Consistência da informação técnica

---

# Escalabilidade

A estrutura deverá permitir:

- Novas culturas
- Novos calendários
- Novas tarefas
- Novos métodos de cultivo
- Novas recomendações técnicas

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Agricultura constitui um dos pilares da plataforma OTJ, fornecendo uma base de dados estruturada para a gestão, consulta e acompanhamento das atividades agrícolas, integrada com os restantes módulos da plataforma.