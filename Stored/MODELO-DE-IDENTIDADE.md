# MODELO-DE-IDENTIDADE

## Objetivo

Definir o modelo de identidade do OTJ, estabelecendo a relação entre utilizadores, perfis, organizações e funções.

---

# Princípios

- Uma identidade única por utilizador.
- Separação entre identidade, perfil e permissões.
- Suporte para utilizadores individuais e institucionais.
- Extensibilidade para novas funções.

---

# Entidades

- Identidade
- Utilizador
- Perfil
- Instituição
- Organização
- Função (Role)
- Permissão
- Sessão

---

# Relações

- Uma Identidade pode possuir um ou mais Perfis.
- Um Perfil pode estar associado a uma Instituição.
- Um Perfil pode ter várias Funções.
- Cada Função agrega um conjunto de Permissões.

---

# Regras

- Identificadores únicos.
- Verificação de e-mail.
- Histórico de alterações relevantes.
- Compatibilidade com MFA e SSO.

---

# Estado

Versão: 1.0

Estado: Em desenvolvimento.
