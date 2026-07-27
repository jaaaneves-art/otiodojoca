# FAQ-ARQUITETURA

## Objetivo

Responder às perguntas mais frequentes sobre a arquitetura do OTJ, facilitando a compreensão das principais decisões e princípios.

---

## Perguntas Frequentes

### O que é a Arquitetura OTJ?
É a estrutura que organiza os módulos, serviços, dados e integrações da plataforma.

### Porque é utilizada uma arquitetura modular?
Para reduzir o acoplamento, aumentar a reutilização e facilitar a evolução do sistema.

### Como comunicam os módulos?
Através de APIs e interfaces públicas bem definidas. Quando apropriado, podem ser utilizados eventos assíncronos.

### Onde são registadas as decisões arquiteturais?
No documento **DECISOES-ARQUITETURAIS.md** e, quando aplicável, em ADR (Architecture Decision Records).

### Como são geridas as permissões?
Através de funções (roles) que agregam permissões, seguindo o princípio do menor privilégio.

### Como evolui a arquitetura?
De forma incremental, preservando a compatibilidade e documentando alterações relevantes.

---

## Estado

Versão: 1.0

Estado: Em desenvolvimento.
