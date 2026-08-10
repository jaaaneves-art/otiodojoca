# OTJ-SQL-V05 — Localizações

## Objetivo

Este documento define a implementação SQL do sistema de localizações da plataforma **O Tio do Joca (OTJ)**.

As localizações constituem um dos elementos centrais da plataforma, permitindo associar informação geográfica a utilizadores, entidades, eventos, explorações agrícolas, património, mercado, turismo e restantes módulos.

---

# Princípios

O sistema de localizações deverá garantir:

- Organização hierárquica
- Integridade referencial
- Reutilização da informação
- Compatibilidade com sistemas cartográficos
- Facilidade de pesquisa
- Escalabilidade

---

# Estrutura Hierárquica

A organização geográfica segue, sempre que aplicável, a estrutura administrativa oficial.

Exemplo:

- País
- Distrito / Região Autónoma
- Concelho
- Freguesia
- Localidade
- Lugar

A estrutura deverá permitir futuras adaptações a diferentes países.

---

# Entidades Associadas

As localizações poderão ser utilizadas por diversos módulos, incluindo:

- Utilizadores
- Perfis
- Explorações agrícolas
- Explorações pecuárias
- Empresas
- Cooperativas
- Associações
- Eventos
- Feiras
- Mercados
- Património
- Trilhos
- Pontos de interesse
- Anúncios
- Artigos
- Conteúdos editoriais

---

# Informação Geográfica

Cada localização poderá incluir:

- Nome
- Código oficial (quando existente)
- Tipo de localização
- Latitude
- Longitude
- Área geográfica
- Código postal (quando aplicável)

---

# Relações

As localizações estabelecem relações hierárquicas entre si, permitindo representar corretamente a organização territorial.

Cada registo poderá possuir uma localização superior, formando uma estrutura em árvore.

---

# Pesquisa

A estrutura deverá permitir pesquisas por:

- Nome
- Tipo
- Código
- Região
- Coordenadas geográficas
- Proximidade

---

# Integridade

As relações entre localizações deverão garantir:

- Consistência hierárquica
- Ausência de ciclos
- Integridade referencial
- Validação dos níveis administrativos

---

# Compatibilidade

O sistema deverá permitir integração futura com:

- Serviços cartográficos
- OpenStreetMap
- Google Maps
- Sistemas SIG
- Serviços de georreferenciação

---

# Escalabilidade

A estrutura deverá permitir:

- Novos níveis administrativos
- Novos países
- Novos tipos de localização
- Novas funcionalidades geográficas

Sem necessidade de alterações estruturais significativas.

---

# Conclusão

O sistema de localizações constitui uma infraestrutura transversal da plataforma OTJ, assegurando uma representação geográfica consistente, reutilizável e preparada para suportar todas as funcionalidades atuais e futuras da Base de Dados.