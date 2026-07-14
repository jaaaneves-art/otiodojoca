# OTJ-SQL-V18 — Dados Iniciais (Seed Data)

## Objetivo

Este documento define a estratégia de criação dos **dados iniciais (Seed Data)** da Base de Dados da plataforma **O Tio do Joca (OTJ)**.

Os dados iniciais permitem preparar o sistema para utilização, testes e desenvolvimento, garantindo que a plataforma inicia com uma estrutura funcional e coerente.

---

# Princípios

A implementação dos dados iniciais deverá garantir:

- Consistência da informação
- Reprodutibilidade dos ambientes
- Facilidade de instalação
- Apoio ao desenvolvimento
- Separação entre dados técnicos e dados reais

---

# Tipos de Dados Iniciais

Os dados iniciais poderão incluir:

- Categorias
- Taxonomias
- Tipos de localização
- Estados
- Permissões
- Papéis de utilizador
- Configurações do sistema
- Dados de referência

---

# Dados Técnicos

Os dados técnicos incluem informação necessária ao funcionamento da plataforma.

Exemplos:

- Roles do sistema
- Estados dos conteúdos
- Tipos de ficheiros
- Categorias base
- Configurações gerais

---

# Dados de Exemplo

Para ambientes de desenvolvimento e testes poderão existir dados simulados, como:

- Utilizadores de teste
- Publicações exemplo
- Eventos exemplo
- Produtos exemplo
- Conteúdos agrícolas exemplo

Estes dados nunca deverão ser confundidos com dados reais de produção.

---

# Organização

Os Seeds deverão ser organizados por módulos:

- Seed Utilizadores
- Seed Localizações
- Seed Taxonomias
- Seed Agricultura
- Seed Pecuária
- Seed Mercado
- Seed Fórum
- Seed Eventos
- Seed Configurações

---

# Execução

A aplicação dos dados iniciais deverá permitir:

- Instalação automática
- Reposição de ambientes de teste
- Criação de ambientes de desenvolvimento
- Validação da estrutura SQL

---

# Segurança

Os dados iniciais deverão respeitar:

- Políticas RLS
- Regras de permissões
- Proteção de dados pessoais
- Separação entre desenvolvimento e produção

---

# Manutenção

Os ficheiros Seed deverão:

- Ser versionados
- Ser documentados
- Ser atualizados com a evolução da plataforma
- Permitir execução repetida sem criar duplicações

---

# Escalabilidade

A estrutura deverá permitir adicionar:

- Novas categorias
- Novas configurações
- Novas classificações
- Novos módulos

Sem necessidade de alterar a arquitetura existente.

---

# Conclusão

Os dados iniciais constituem a base de arranque da plataforma OTJ, garantindo que todos os ambientes possuem uma configuração consistente, controlada e preparada para evolução futura.