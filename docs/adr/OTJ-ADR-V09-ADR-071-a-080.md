# OTJ — ADR (71–80)

## ADR-071 — Arquitetura Modular por Domínio
**Estado:** Aceite

### Decisão
A plataforma será organizada por domínios funcionais independentes (Agricultura, Pecuária, Turismo, Marketplace, Comunidade, Municípios, etc.).

### Consequências
- menor acoplamento
- evolução independente dos módulos

---

## ADR-072 — Marketplace Integrado
**Estado:** Aceite

### Decisão
O Marketplace será um módulo nativo da plataforma, reutilizando autenticação, perfis e permissões.

### Consequências
- experiência uniforme
- menor duplicação

---

## ADR-073 — Módulo de Municípios
**Estado:** Aceite

### Decisão
Cada município terá um espaço próprio com gestão autónoma de conteúdos.

### Consequências
- descentralização
- autonomia editorial

---

## ADR-074 — Módulo de Freguesias
**Estado:** Aceite

### Decisão
As freguesias poderão publicar informação institucional e eventos de forma independente.

### Consequências
- proximidade ao cidadão
- maior participação local

---

## ADR-075 — Módulo de Agricultura
**Estado:** Aceite

### Decisão
A informação agrícola será organizada por culturas, regiões, calendário e recomendações.

### Consequências
- apoio à decisão
- organização consistente

---

## ADR-076 — Módulo de Pecuária
**Estado:** Aceite

### Decisão
Os conteúdos pecuários serão estruturados por espécie, exploração e boas práticas.

### Consequências
- especialização
- facilidade de manutenção

---

## ADR-077 — Módulo de Turismo
**Estado:** Aceite

### Decisão
O turismo integrará património, alojamentos, roteiros e eventos.

### Consequências
- valorização do território
- melhor experiência do utilizador

---

## ADR-078 — Agenda Nacional
**Estado:** Aceite

### Decisão
Todos os eventos serão agregados numa agenda nacional pesquisável.

### Consequências
- pesquisa unificada
- maior visibilidade dos eventos

---

## ADR-079 — Comunidade
**Estado:** Aceite

### Decisão
A plataforma disponibilizará funcionalidades colaborativas para cidadãos e entidades.

### Consequências
- maior participação
- fortalecimento da comunidade

---

## ADR-080 — Aplicação PWA
**Estado:** Aceite

### Decisão
A aplicação móvel será implementada inicialmente como Progressive Web App (PWA).

### Consequências
- desenvolvimento unificado
- menor custo de manutenção
