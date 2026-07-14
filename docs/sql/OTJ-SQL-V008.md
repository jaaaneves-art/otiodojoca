# OTJ-SQL-V08 — Pecuária

## Objetivo

Este documento define a implementação SQL do módulo de Pecuária da plataforma **O Tio do Joca (OTJ)**.

Este módulo suporta a gestão da informação relacionada com animais de produção, aves, pequenos animais, apicultura e outras atividades pecuárias, permitindo organizar conhecimento técnico e acompanhar as diferentes explorações.

---

# Princípios

O módulo deverá garantir:

- Organização por espécies
- Reutilização da informação
- Integração com taxonomias
- Associação a localizações
- Escalabilidade
- Integridade dos dados

---

# Âmbito

O módulo poderá incluir, entre outros:

- Bovinos
- Ovinos
- Caprinos
- Suínos
- Equinos
- Coelhos
- Aves de capoeira
- Pombos
- Aves ornamentais
- Abelhas
- Outras espécies de interesse pecuário

---

# Informação

Cada espécie ou atividade poderá possuir:

- Nome comum
- Nome científico
- Categoria
- Descrição
- Características
- Alimentação
- Reprodução
- Alojamento
- Bem-estar animal
- Sanidade
- Vacinação
- Doenças
- Parasitas
- Boas práticas de criação

---

# Relações

As espécies poderão estar relacionadas com:

- Taxonomias
- Localizações
- Utilizadores
- Explorações pecuárias
- Calendário pecuário
- Artigos
- Fotografias
- Vídeos
- Guias técnicos
- Checklists

---

# Calendário Pecuário

A estrutura deverá permitir associar tarefas ao calendário, incluindo:

- Alimentação
- Reprodução
- Vacinação
- Desparasitação
- Limpeza das instalações
- Controlo sanitário
- Produção
- Inspeções
- Registos obrigatórios

---

# Checklists

O módulo deverá suportar listas de acompanhamento para cada espécie ou exploração, permitindo ao utilizador registar a execução das tarefas ao longo do tempo.

---

# Pesquisa

As pesquisas poderão ser efetuadas por:

- Espécie
- Categoria
- Atividade
- Localização
- Sistema de produção
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

- Novas espécies
- Novos calendários
- Novas tarefas
- Novos métodos de produção
- Novas recomendações técnicas

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Pecuária constitui um componente essencial da plataforma OTJ, disponibilizando uma base de dados estruturada para apoiar produtores, criadores e utilizadores na gestão e acompanhamento das atividades pecuárias, integrada com os restantes módulos da plataforma.