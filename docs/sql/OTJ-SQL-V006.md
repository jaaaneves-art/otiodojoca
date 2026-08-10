# OTJ-SQL-V06 — Taxonomias

## Objetivo

Este documento define a implementação SQL do sistema de taxonomias da plataforma **O Tio do Joca (OTJ)**.

As taxonomias permitem classificar, organizar e relacionar toda a informação da plataforma de forma consistente, reutilizável e escalável.

---

# Princípios

O sistema de taxonomias deverá garantir:

- Uniformização da classificação
- Reutilização de categorias
- Flexibilidade
- Facilidade de pesquisa
- Escalabilidade
- Integridade dos dados

---

# Estrutura

O sistema deverá permitir diferentes tipos de taxonomias, incluindo:

- Categorias
- Subcategorias
- Etiquetas (Tags)
- Temas
- Tipologias
- Estados
- Classificações

Cada tipo poderá possuir a sua própria estrutura hierárquica.

---

# Hierarquia

As taxonomias deverão suportar relações hierárquicas, permitindo criar árvores de classificação.

Exemplo:

Agricultura
- Hortícolas
  - Tomate
  - Alface
  - Cenoura

---

# Aplicação

As taxonomias poderão ser utilizadas por todos os módulos da plataforma, incluindo:

- Agricultura
- Pecuária
- Jardim
- Árvores de fruto
- Plantas ornamentais
- Animais
- Eventos
- Mercado
- Fórum
- Biblioteca
- Receitas
- Património
- Turismo
- Conteúdos editoriais

---

# Informação

Cada taxonomia poderá incluir:

- Nome
- Descrição
- Tipo
- Hierarquia
- Estado
- Ordem de apresentação
- Ícone (opcional)
- Cor identificativa (opcional)

---

# Relações

Uma taxonomia poderá estar associada a múltiplas entidades da plataforma, permitindo reutilização sem duplicação de informação.

---

# Pesquisa

O sistema deverá permitir pesquisas por:

- Nome
- Tipo
- Categoria
- Subcategoria
- Etiquetas
- Estado

---

# Integridade

A implementação deverá assegurar:

- Eliminação controlada
- Integridade referencial
- Validação das hierarquias
- Prevenção de duplicações

---

# Escalabilidade

A estrutura deverá permitir:

- Novos tipos de taxonomias
- Novos níveis hierárquicos
- Novos sistemas de classificação
- Internacionalização

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O sistema de taxonomias constitui um elemento transversal da plataforma OTJ, permitindo organizar e relacionar toda a informação de forma coerente, eficiente e preparada para a evolução contínua da Base de Dados.