# MODULO-01-ANUNCIOS

## Objetivo

O módulo Anúncios constitui o núcleo funcional do Mercado da Terra.

Toda a interação da plataforma assenta na criação, gestão, pesquisa e consulta de anúncios.

---

# Objetivos

- Utilizar uma única arquitetura para todos os tipos de anúncio.
- Evitar duplicação de código.
- Permitir evolução futura sem alterações estruturais.
- Garantir compatibilidade com anúncios existentes.

---

# Entidade Principal

Anúncio

Cada anúncio possui um tipo que define o seu comportamento.

---

# Tipos de Anúncio

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

---

# Campos Base

- ID
- Tipo
- Categoria
- Título
- Descrição
- Fotografias
- Autor
- Localização
- Estado
- Disponibilidade
- Data de criação
- Data de atualização

Campos específicos são ativados conforme o tipo.

---

# Estados

- Rascunho
- Ativo
- Reservado
- Concluído
- Expirado
- Arquivado
- Suspenso

---

# Funcionalidades

- Criar anúncio
- Editar anúncio
- Publicar
- Pausar
- Reativar
- Renovar
- Duplicar
- Arquivar
- Eliminar
- Favoritar
- Partilhar
- Denunciar

---

# Fotografias

- Múltiplas imagens
- Imagem principal
- Reordenação
- Compressão automática

Futuro:

- Vídeo
- Imagens 360º

---

# Pesquisa

Todos os anúncios utilizam a mesma infraestrutura de pesquisa.

Filtros:

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

# Regras

- O tipo controla o comportamento do anúncio.
- Apenas são apresentados os campos relevantes.
- Todos os anúncios utilizam o mesmo modelo de dados.
- Novos tipos devem poder ser adicionados sem alterar a arquitetura.

---

# Evolução

A evolução do módulo deverá privilegiar configuração em vez de criação de novos módulos ou duplicação de funcionalidades.

---

# Estado

Versão: 1.0

Estado: Em desenvolvimento.
