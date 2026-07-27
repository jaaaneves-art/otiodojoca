# MODELO-DE-PERMISSOES

## Objetivo

Definir o modelo de autorização do OTJ, especificando funções, permissões e políticas de acesso.

---

# Princípios

- Menor privilégio.
- Separação entre autenticação e autorização.
- Permissões atribuídas por funções.
- Herança controlada.
- Auditoria de ações sensíveis.

---

# Componentes

- Permissão
- Função (Role)
- Política de Acesso
- Grupo
- Contexto

---

# Funções Base

- Visitante
- Utilizador
- Moderador
- Editor
- Gestor
- Administrador
- Administrador de Sistema

---

# Regras

- Um utilizador pode possuir várias funções.
- As permissões são concedidas através das funções.
- Políticas podem restringir permissões por contexto.
- Todas as alterações de permissões devem ser registadas.

---

# Estado

Versão: 1.0

Estado: Em desenvolvimento.
