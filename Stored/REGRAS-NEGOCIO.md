# REGRAS-NEGOCIO

## Objetivo

Definir as regras de negócio comuns a todos os anúncios do Mercado da Terra.

---

# Regras Gerais

- Todos os anúncios pertencem a um utilizador.
- Todo o anúncio possui um tipo.
- Todo o anúncio pertence a uma categoria.
- Todo o anúncio possui um estado.
- Todos os anúncios possuem data de criação e atualização.

---

# Tipos de Anúncio

Tipos suportados:

- Venda
- Compra
- Troca
- Oferta
- Serviço
- Pedido de Serviço
- Aluguer
- Empréstimo
- Parceria
- Partilha

O tipo determina:

- Campos obrigatórios
- Campos opcionais
- Campos ocultos
- Ações disponíveis
- Regras de validação

---

# Estados

Um anúncio pode assumir os seguintes estados:

- Rascunho
- Ativo
- Reservado
- Concluído
- Expirado
- Arquivado
- Suspenso

---

# Publicação

Para ser publicado, um anúncio deve possuir:

- Título
- Descrição
- Categoria
- Tipo
- Localização
- Autor

Os restantes campos dependem do tipo de anúncio.

---

# Pesquisa

Todos os anúncios utilizam o mesmo mecanismo de pesquisa.

Filtros disponíveis:

- Tipo
- Categoria
- Localização
- Distância
- Estado
- Data
- Utilizador
- Disponibilidade
- Preço (quando aplicável)

---

# Compatibilidade

As alterações futuras devem:

- Preservar os anúncios existentes.
- Evitar regressões.
- Utilizar migrações seguras.
- Manter compatibilidade com versões anteriores.

---

# Princípios Arquiteturais

- Arquitetura única.
- Modelo de dados único.
- Reutilização máxima de código.
- Sem duplicação de funcionalidades.
- Escalabilidade.
- Evolução contínua.
