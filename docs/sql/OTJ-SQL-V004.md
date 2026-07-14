# OTJ-SQL-V04 — Perfis

## Objetivo

Este documento define a implementação SQL da gestão de perfis da plataforma **O Tio do Joca (OTJ)**.

Os perfis armazenam toda a informação pública e privada dos utilizadores que não pertence ao sistema de autenticação, permitindo uma separação clara entre identidade, autenticação e dados da aplicação.

---

# Princípios

A estrutura dos perfis deverá garantir:

- Separação entre autenticação e informação do utilizador
- Flexibilidade para futuras evoluções
- Facilidade de atualização
- Proteção da privacidade
- Compatibilidade com todos os módulos da plataforma

---

# Relação com Utilizadores

Cada perfil pertence a um único utilizador.

A relação é do tipo:

**Utilizador (1) → (1) Perfil**

O identificador do perfil deverá corresponder ao identificador do utilizador autenticado, assegurando uma associação direta e permanente.

---

# Informação do Perfil

O perfil poderá incluir, entre outros:

- Nome próprio
- Apelido
- Nome de apresentação
- Fotografia
- Biografia
- Data de nascimento (opcional)
- Género (opcional)
- Idioma preferido
- Localização
- Contactos públicos
- Ligações para redes sociais
- Preferências de comunicação

---

# Definições do Utilizador

O perfil poderá ainda armazenar:

- Preferências de notificações
- Preferências de privacidade
- Preferências de idioma
- Preferências de visualização
- Outras configurações pessoais

---

# Estados do Perfil

Um perfil poderá encontrar-se em diferentes estados, como por exemplo:

- Ativo
- Incompleto
- Em validação
- Suspenso
- Arquivado

---

# Privacidade

Cada campo poderá possuir regras próprias de visibilidade, permitindo distinguir entre:

- Informação pública
- Informação visível apenas para utilizadores autenticados
- Informação privada

---

# Integridade

A eliminação ou desativação de um utilizador deverá respeitar as regras de integridade definidas para o respetivo perfil e restantes entidades relacionadas.

---

# Segurança

O acesso aos perfis deverá ser controlado através de:

- Row Level Security (RLS)
- Permissões por função
- Políticas de leitura e escrita
- Validação da identidade do utilizador

---

# Escalabilidade

A estrutura deverá permitir a adição de novos campos e funcionalidades sem necessidade de alterações profundas ao modelo de dados.

---

# Conclusão

A implementação dos perfis assegura uma gestão flexível e segura da informação dos utilizadores, servindo de base para a personalização da experiência na plataforma OTJ e para a integração com os restantes módulos da Base de Dados.