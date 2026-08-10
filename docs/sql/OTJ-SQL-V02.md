# OTJ-SQL-V02 — Schemas

## Objetivo

Este documento define a organização lógica da Base de Dados através da utilização de **schemas**, permitindo separar funcionalidades, melhorar a organização e facilitar a manutenção da plataforma OTJ.

---

# Princípios

A utilização de schemas tem como objetivos:

- Organização modular
- Isolamento funcional
- Maior segurança
- Facilidade de manutenção
- Melhor escalabilidade
- Controlo de permissões

---

# Schema Principal

## public

Contém as tabelas utilizadas diretamente pela aplicação.

Inclui, entre outras:

- Utilizadores
- Perfis
- Localizações
- Taxonomias
- Agricultura
- Pecuária
- Mercado
- Fórum
- Eventos
- Media

---

# Schemas Técnicos

Consoante a evolução da plataforma, poderão ser criados schemas específicos para funções técnicas.

Exemplos:

## auth

Gerido pelo Supabase para autenticação.

---

## storage

Gerido pelo Supabase para armazenamento de ficheiros.

---

## extensions

Utilizado pelas extensões PostgreSQL.

---

## audit

Registo de auditoria e histórico de alterações.

---

## logs

Registo técnico de operações e eventos internos.

---

## analytics

Dados estatísticos e indicadores de utilização.

---

# Critérios de Utilização

Os schemas técnicos deverão:

- Conter apenas informação da sua responsabilidade
- Não duplicar dados do schema principal
- Manter relações através de chaves apropriadas
- Respeitar as políticas de segurança definidas

---

# Permissões

Cada schema poderá possuir permissões próprias, permitindo:

- Leitura
- Escrita
- Administração
- Acesso exclusivo a determinados serviços

---

# Benefícios

A utilização de schemas proporciona:

- Melhor organização
- Facilidade de desenvolvimento
- Segurança reforçada
- Maior desempenho em ambientes complexos
- Evolução independente de módulos

---

# Compatibilidade

A estrutura de schemas é totalmente compatível com:

- PostgreSQL
- Supabase
- Ferramentas ORM
- Sistemas de migração

---

# Conclusão

A organização por schemas constitui uma base sólida para o crescimento da plataforma OTJ, permitindo uma arquitetura limpa, modular e preparada para futuras expansões.