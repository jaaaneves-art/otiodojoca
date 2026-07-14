# OTJ-SQL-V03 — Utilizadores

## Objetivo

Este documento define a implementação SQL da gestão de utilizadores da plataforma **O Tio do Joca (OTJ)**.

A autenticação é assegurada pelo **Supabase Auth**, enquanto a informação adicional de cada utilizador é armazenada em tabelas próprias da aplicação.

---

# Princípios

A gestão de utilizadores deverá garantir:

- Identificação única de cada utilizador
- Segurança da autenticação
- Separação entre autenticação e dados da aplicação
- Facilidade de gestão de permissões
- Escalabilidade

---

# Autenticação

A autenticação é realizada através do **Supabase Auth**.

Entre os métodos suportados poderão incluir-se:

- Email e palavra-passe
- Magic Link
- OAuth
- Outros métodos suportados pelo Supabase

A tabela de autenticação é gerida automaticamente pelo Supabase e não deverá ser alterada diretamente.

---

# Identificador

Cada utilizador é identificado por um **UUID**, utilizado como chave primária e referência em toda a Base de Dados.

---

# Dados Base

Para cada utilizador deverão existir, entre outros, os seguintes elementos:

- Identificador único
- Estado da conta
- Data de criação
- Data da última atualização
- Data do último acesso

---

# Estados da Conta

Uma conta poderá assumir diferentes estados, como por exemplo:

- Ativa
- Pendente de validação
- Suspensa
- Bloqueada
- Eliminada

---

# Relações

Cada utilizador poderá estar associado a:

- Um perfil
- Vários papéis (roles)
- Publicações
- Comentários
- Eventos
- Explorações agrícolas
- Explorações pecuárias
- Anúncios
- Mensagens
- Outros registos da plataforma

---

# Integridade

Todas as referências ao utilizador deverão utilizar chaves estrangeiras, garantindo a integridade referencial da Base de Dados.

---

# Segurança

Os dados dos utilizadores deverão ser protegidos através de:

- Row Level Security (RLS)
- Políticas de acesso
- Permissões por função
- Validação da identidade

---

# Escalabilidade

A estrutura deverá permitir:

- Novos métodos de autenticação
- Novos tipos de utilizador
- Novos papéis
- Novas permissões
- Integração com futuros serviços

---

# Conclusão

A implementação da gestão de utilizadores constitui a base da segurança da plataforma OTJ, assegurando uma identificação única, autenticação robusta e integração consistente com todos os restantes módulos da Base de Dados.