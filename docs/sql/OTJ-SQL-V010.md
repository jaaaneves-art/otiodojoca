# OTJ-SQL-V10 — Fórum

## Objetivo

Este documento define a implementação SQL do módulo de Fórum da plataforma **O Tio do Joca (OTJ)**.

O Fórum constitui o principal espaço de partilha de conhecimento entre os utilizadores, permitindo a criação de discussões, a colocação de questões, a troca de experiências e a construção de uma comunidade colaborativa.

---

# Princípios

O módulo deverá garantir:

- Organização por categorias
- Facilidade de navegação
- Integridade das discussões
- Moderação eficiente
- Escalabilidade
- Segurança

---

# Âmbito

O Fórum poderá incluir áreas como:

- Agricultura
- Pecuária
- Jardinagem
- Árvores de fruto
- Máquinas agrícolas
- Construção rural
- Tradições
- Gastronomia
- Eventos
- Classificados
- Apoio técnico
- Outros temas definidos pela administração

---

# Informação

Cada tópico poderá incluir:

- Título
- Conteúdo
- Categoria
- Autor
- Data de criação
- Data da última atualização
- Estado
- Número de visualizações
- Número de respostas

Cada resposta poderá incluir:

- Conteúdo
- Autor
- Data de publicação
- Data de edição
- Estado

---

# Relações

Os tópicos e respostas poderão estar associados a:

- Utilizadores
- Perfis
- Categorias
- Taxonomias
- Fotografias
- Ficheiros anexos
- Reações
- Denúncias
- Favoritos

---

# Estados

Os tópicos e respostas poderão assumir diferentes estados, como por exemplo:

- Rascunho
- Publicado
- Editado
- Fechado
- Oculto
- Removido
- Arquivado

---

# Moderação

O módulo deverá permitir:

- Aprovação de conteúdos
- Encerramento de tópicos
- Remoção de mensagens
- Gestão de denúncias
- Ações de moderação registadas em histórico

---

# Pesquisa

A estrutura deverá permitir pesquisas por:

- Título
- Conteúdo
- Categoria
- Autor
- Data
- Etiquetas
- Palavra-chave

---

# Integridade

A implementação deverá assegurar:

- Integridade referencial
- Histórico de alterações
- Eliminação controlada
- Proteção contra perda de dados
- Consistência entre tópicos e respostas

---

# Escalabilidade

A estrutura deverá permitir:

- Novas categorias
- Novos tipos de conteúdo
- Sistemas de reputação
- Votações
- Respostas aceites
- Integração com notificações

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Fórum constitui um elemento central da plataforma OTJ, promovendo a colaboração entre utilizadores e a criação de uma base de conhecimento organizada, pesquisável e em constante evolução.