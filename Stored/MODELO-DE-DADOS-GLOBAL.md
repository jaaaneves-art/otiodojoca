# MODELO-DE-DADOS-GLOBAL

## Objetivo

Definir a visão global do modelo de dados do OTJ, identificando as principais entidades, as suas relações e os princípios que orientam a modelação da informação.

---

# Princípios

- Uma única fonte de verdade para cada entidade.
- Evitar duplicação de dados.
- Integridade referencial.
- Evolução compatível das estruturas.
- Reutilização de entidades entre módulos.

---

# Entidades Principais

- Utilizador
- Perfil
- Instituição
- Anúncio
- Categoria
- Evento
- Conteúdo
- Cultura
- Espécie Animal
- Exploração
- Parcela
- Equipamento
- Notificação
- Mensagem
- Avaliação

---

# Relações

- Um Utilizador pode possuir vários Perfis.
- Um Perfil pode estar associado a uma Instituição.
- Um Anúncio pertence a uma Categoria.
- Um Evento pode ser organizado por um Utilizador ou Instituição.
- Uma Exploração pode conter várias Parcelas.
- Todos os módulos podem gerar Notificações.

---

# Regras

- Cada entidade possui um identificador único.
- Auditoria para alterações relevantes.
- Versionamento quando aplicável.
- Chaves externas para relações entre entidades.

---

# Estado

Versão: 1.0

Estado: Em desenvolvimento.
