# OTJ-SQL-V09 — Mercado

## Objetivo

Este documento define a implementação SQL do módulo de Mercado da plataforma **O Tio do Joca (OTJ)**.

Este módulo permite a publicação e gestão de anúncios, produtos, serviços e oportunidades de negócio, promovendo a ligação entre produtores, consumidores, empresas e instituições.

---

# Princípios

O módulo deverá garantir:

- Organização estruturada dos anúncios
- Facilidade de pesquisa
- Segurança das transações
- Integração com taxonomias
- Associação a localizações
- Escalabilidade

---

# Âmbito

O módulo poderá incluir:

- Venda de produtos agrícolas
- Venda de animais
- Plantas e sementes
- Máquinas agrícolas
- Ferramentas
- Equipamentos
- Serviços agrícolas
- Prestação de serviços
- Compra e venda de terrenos
- Outros anúncios relacionados com o mundo rural

---

# Informação

Cada anúncio poderá incluir:

- Título
- Descrição
- Categoria
- Estado
- Preço
- Moeda
- Quantidade
- Unidade de medida
- Fotografias
- Localização
- Data de publicação
- Data de expiração

---

# Relações

Os anúncios poderão estar associados a:

- Utilizadores
- Perfis
- Localizações
- Taxonomias
- Fotografias
- Mensagens
- Favoritos
- Histórico de alterações

---

# Estados

Os anúncios poderão assumir diferentes estados, como por exemplo:

- Rascunho
- Pendente de aprovação
- Publicado
- Suspenso
- Vendido
- Expirado
- Arquivado

---

# Pesquisa

A estrutura deverá permitir pesquisas por:

- Produto
- Categoria
- Localização
- Preço
- Estado
- Palavra-chave
- Distância
- Data de publicação

---

# Integridade

A implementação deverá assegurar:

- Integridade referencial
- Validação dos dados
- Controlo de duplicações
- Eliminação controlada
- Histórico de alterações

---

# Escalabilidade

A estrutura deverá permitir:

- Novos tipos de anúncios
- Novas categorias
- Novos métodos de pagamento
- Integração com sistemas externos
- Evolução para comércio eletrónico

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Mercado constitui a base para a criação de um espaço seguro e organizado de compra, venda e prestação de serviços na plataforma OTJ, promovendo a economia local e o desenvolvimento do mundo rural.