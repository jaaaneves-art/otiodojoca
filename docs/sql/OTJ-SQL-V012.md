# OTJ-SQL-V12 — Media

## Objetivo

Este documento define a implementação SQL do módulo de Media da plataforma **O Tio do Joca (OTJ)**.

Este módulo é responsável pela gestão de todos os recursos multimédia utilizados na plataforma, permitindo a associação de imagens, vídeos, documentos, ficheiros áudio e outros conteúdos digitais às diferentes entidades do sistema.

---

# Princípios

O módulo deverá garantir:

- Centralização dos ficheiros
- Reutilização de conteúdos
- Integridade das referências
- Segurança no acesso
- Escalabilidade
- Compatibilidade com o armazenamento do Supabase

---

# Âmbito

O módulo poderá incluir:

- Fotografias
- Vídeos
- Documentos PDF
- Documentos técnicos
- Ficheiros áudio
- Ilustrações
- Ícones
- Outros recursos digitais

---

# Informação

Cada recurso poderá incluir:

- Identificador
- Nome
- Descrição
- Tipo de ficheiro
- Formato
- Tamanho
- Localização de armazenamento
- Data de carregamento
- Autor do carregamento
- Estado

---

# Relações

Os recursos multimédia poderão estar associados a:

- Utilizadores
- Perfis
- Artigos
- Eventos
- Mercado
- Fórum
- Agricultura
- Pecuária
- Receitas
- Património
- Outras entidades da plataforma

---

# Estados

Os recursos poderão assumir diferentes estados, como por exemplo:

- Em carregamento
- Disponível
- Em processamento
- Arquivado
- Eliminado

---

# Armazenamento

Os ficheiros serão armazenados através do sistema de armazenamento do Supabase, mantendo na Base de Dados apenas os metadados e as referências necessárias.

---

# Pesquisa

A estrutura deverá permitir pesquisas por:

- Nome
- Tipo de ficheiro
- Formato
- Autor
- Data
- Entidade associada

---

# Integridade

A implementação deverá assegurar:

- Integridade referencial
- Validação das referências
- Eliminação controlada
- Consistência entre ficheiros e entidades associadas

---

# Escalabilidade

A estrutura deverá permitir:

- Novos formatos de ficheiro
- Diferentes serviços de armazenamento
- Versionamento de ficheiros
- Compressão automática
- Processamento de imagens e vídeos

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O módulo de Media fornece uma infraestrutura centralizada para a gestão de recursos digitais da plataforma OTJ, garantindo organização, segurança e reutilização eficiente dos conteúdos multimédia.