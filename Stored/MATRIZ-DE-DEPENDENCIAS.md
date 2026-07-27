# MATRIZ-DE-DEPENDENCIAS

## Objetivo

Documentar as dependências entre os módulos e componentes do OTJ, facilitando a análise de impacto, manutenção e evolução da arquitetura.

---

## Princípios

- Dependências explícitas.
- Baixo acoplamento.
- Elevada coesão.
- Comunicação através de interfaces públicas.

---

## Dependências dos Domínios

| Domínio | Depende de |
|---------|------------|
| Mercado da Terra | Autenticação, Utilizadores, Notificações |
| Comunidade | Autenticação, Perfis, Pesquisa |
| Biblioteca de Conhecimento | Pesquisa, IA |
| Gestão da Exploração | Utilizadores, Dados, Notificações |
| Calendário Agrícola | Meteorologia, Notificações |

---

## Regras

- Evitar dependências circulares.
- Serviços transversais podem ser utilizados por todos os domínios.
- Novas dependências devem ser documentadas antes da implementação.

---

## Estado

Versão: 1.0

Estado: Em desenvolvimento.
