# OTJ-SQL-V13 — Segurança

## Objetivo

Este documento define os princípios de segurança aplicáveis à implementação SQL da Base de Dados da plataforma **O Tio do Joca (OTJ)**.

A segurança deverá proteger os dados, garantir a integridade da informação e controlar rigorosamente os acessos às diferentes funcionalidades da plataforma.

---

# Princípios

A implementação deverá assegurar:

- Confidencialidade
- Integridade
- Disponibilidade
- Autenticidade
- Rastreabilidade
- Privilégio mínimo

---

# Autenticação

A autenticação dos utilizadores será efetuada através do **Supabase Auth**, garantindo mecanismos modernos e seguros de gestão de identidade.

A Base de Dados nunca deverá armazenar palavras-passe dos utilizadores.

---

# Autorização

O acesso aos dados será controlado através de:

- Papéis (Roles)
- Permissões
- Políticas de segurança
- Row Level Security (RLS)

Cada utilizador apenas poderá aceder aos recursos para os quais possui autorização.

---

# Proteção dos Dados

A implementação deverá proteger:

- Dados pessoais
- Informações privadas
- Conteúdos não publicados
- Registos administrativos
- Configurações internas

Sempre que aplicável, deverão ser aplicadas medidas de minimização e proteção dos dados.

---

# Auditoria

As operações relevantes deverão poder ser registadas para efeitos de auditoria, incluindo:

- Criação de registos
- Alterações
- Eliminações
- Aprovações
- Ações administrativas

---

# Integridade

A Base de Dados deverá utilizar:

- Chaves primárias
- Chaves estrangeiras
- Constraints
- Validações
- Transações

De forma a garantir a consistência da informação.

---

# Segurança Física

Sempre que possível, deverão ser utilizados os mecanismos disponibilizados pelo Supabase e PostgreSQL para:

- Encriptação
- Ligações seguras
- Gestão de credenciais
- Cópias de segurança
- Recuperação em caso de falha

---

# Boas Práticas

A implementação deverá seguir boas práticas de desenvolvimento, incluindo:

- Menor privilégio possível
- Evitar permissões excessivas
- Separação entre ambientes
- Validação de dados
- Atualizações regulares

---

# Escalabilidade

A arquitetura de segurança deverá permitir a introdução de:

- Novos papéis
- Novas permissões
- Novos mecanismos de autenticação
- Novas políticas de proteção

Sem necessidade de alterações profundas da Base de Dados.

---

# Conclusão

A segurança constitui um princípio transversal de toda a implementação SQL do projeto OTJ, assegurando a proteção dos dados, o controlo dos acessos e a confiança na utilização da plataforma.