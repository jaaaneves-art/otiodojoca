# OTJ-SQL-V11 — Eventos

## Objetivo

Este documento define a implementação SQL do módulo de Eventos da plataforma **O Tio do Joca (OTJ)**.

Este módulo permite a gestão de eventos locais, regionais e nacionais, promovendo a divulgação de feiras, mercados, romarias, festivais, exposições, concursos, formações e outras iniciativas de interesse para a comunidade.

---

# Princípios

O módulo deverá garantir:

- Organização cronológica dos eventos
- Associação geográfica
- Facilidade de pesquisa
- Integração com o calendário da plataforma
- Escalabilidade
- Integridade dos dados

---

# Âmbito

O módulo poderá incluir:

- Feiras agrícolas
- Mercados
- Festivais
- Romarias
- Festas populares
- Exposições
- Concursos
- Workshops
- Formações
- Conferências
- Visitas guiadas
- Outros eventos de interesse

---

# Informação

Cada evento poderá incluir:

- Título
- Descrição
- Categoria
- Organizador
- Localização
- Data de início
- Data de fim
- Horário
- Contactos
- Website
- Fotografias
- Cartaz
- Estado

---

# Relações

Os eventos poderão estar associados a:

- Utilizadores
- Perfis
- Localizações
- Taxonomias
- Entidades organizadoras
- Fotografias
- Documentos
- Comentários
- Favoritos

---

# Estados

Os eventos poderão assumir diferentes estados, como por exemplo:

- Rascunho
- Pendente de aprovação
- Publicado
- Cancelado
- Concluído
- Arquivado

---

# Pesquisa

A estrutura deverá permitir pesquisas por:

- Nome
- Categoria
- Localização
- Data
- Organizador
- Palavra-chave

---

# Integridade

A implementação deverá assegurar:

- Integridade referencial
- Validação das datas
- Eliminação controlada
- Consistência entre entidades relacionadas
- Histórico de alterações

---

# Escalabilidade

A estrutura deverá permitir:

- Eventos recorrentes
- Inscrições online
- Venda de bilhetes
- Calendários personalizados
- Integração com serviços externos

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Eventos disponibiliza uma estrutura robusta para organizar e divulgar iniciativas relevantes para a comunidade OTJ, promovendo a participação dos utilizadores e valorizando o património, a cultura e as atividades do mundo rural.