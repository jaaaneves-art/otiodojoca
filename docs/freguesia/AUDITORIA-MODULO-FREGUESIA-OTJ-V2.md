# AUDITORIA E LACUNAS — MÓDULO FREGUESIA OTJ

## Resumo Executivo

A proposta inicial possuía uma boa cobertura temática, mas estava demasiado orientada para listas de categorias. Para uma implementação sustentável era necessário aprofundar a modelação.

A revisão identificou as seguintes melhorias principais.

---

# 1. O QUE JÁ ESTAVA BEM DEFINIDO

- Freguesia como espaço de comunidade e não apenas estrutura administrativa;
- categorias principais;
- destaque próprio para Farmácias;
- separação entre Farmácia e turno de serviço;
- importância das Comissões de Festas;
- integração com calendário;
- reutilização do sistema de localização;
- preocupação com não duplicar funcionalidades;
- necessidade de auditar antes de implementar.

---

# 2. PRINCIPAIS LACUNAS DETECTADAS

## 2.1. Entidade, estabelecimento e localização

A proposta inicial podia levar a colocar uma empresa, uma loja e a respectiva morada no mesmo conceito.

Foi acrescentada uma separação conceptual:

- Entidade;
- Estabelecimento ou unidade;
- Localização.

## 2.2. Relações entre entidades

Faltava um modelo explícito para representar situações como:

- escola pertencente a agrupamento;
- empresa proprietária de estabelecimento;
- comissão organizadora de evento.

Foi acrescentado um modelo relacional genérico.

## 2.3. Qualidade e proveniência dos dados

Faltava responder:

- Quem confirmou esta informação?
- Quando foi verificada?
- Está publicada ou desactualizada?

Foram introduzidos requisitos de origem, validação e revisão.

## 2.4. Horários

A proposta inicial mencionava horários, mas não tratava:

- vários períodos no mesmo dia;
- excepções;
- períodos sazonais;
- encerramentos temporários.

Foi criado um modelo conceptual transversal de horários.

## 2.5. Farmácia de Serviço

Foi aprofundado para exigir:

- início e fim;
- consulta por momento e por data;
- território ou área de cobertura;
- origem;
- última verificação;
- estado de validação.

## 2.6. Gestão e permissões

Faltava clarificar que a Junta não deve controlar automaticamente toda a informação da freguesia.

Foi acrescentado o princípio de gestão distribuída por entidade, respeitando as permissões existentes.

## 2.7. MVP

Faltavam critérios objectivos para determinar quando a primeira versão está realmente pronta.

Foram definidos 15 critérios de aceitação.

---

# 3. RISCOS A EVITAR

## Risco 1 — Criar uma tabela para cada categoria

Exemplo errado:

- `ranchos`;
- `bandas`;
- `clubes`;
- `farmacias`;
- `restaurantes`;
- `comissoes_festas`.

Sem auditoria, isto pode gerar duplicação extrema.

A recomendação é verificar primeiro se um modelo comum de entidades pode suportar estas categorias, criando extensões específicas apenas quando necessário.

## Risco 2 — Transformar tudo numa tabela genérica sem regras

O extremo oposto também é perigoso.

Uma tabela genérica não deve transformar:

- horário;
- evento;
- localização;
- turno;
- relação;

em simples texto ou JSON sem estrutura, quando são dados que precisam de consulta e validação.

## Risco 3 — Duplicar o calendário

Eventos devem utilizar o sistema temporal existente.

## Risco 4 — Duplicar a localização

Não criar nova geografia paralela.

## Risco 5 — Guardar “Farmácia de Serviço” como texto

O turno deve ser temporal e consultável.

## Risco 6 — Informação desactualizada apresentada como actual

Especialmente crítico para:

- Farmácias;
- horários;
- contactos;
- eventos.

---

# 4. RECOMENDAÇÃO DE IMPLEMENTAÇÃO

A implementação deve começar por uma auditoria real do repositório e da base de dados.

Só depois devem ser escolhidas:

- tabelas;
- migrações;
- componentes;
- rotas;
- APIs.

A melhor abordagem é construir primeiro uma **vertical completa de uma freguesia piloto**, testando todos os conceitos antes de expandir.

---

# 5. FICHEIROS RECOMENDADOS

Este documento acompanha:

- `MODULO-FREGUESIA-OTJ-V2-AUDITADO.md` — especificação principal aprofundada;
- `AUDITORIA-MODULO-FREGUESIA-OTJ-V2.md` — resumo da auditoria, lacunas e riscos.

---

# 6. CONCLUSÃO

A proposta passou de uma estrutura de categorias para uma especificação mais sólida baseada em:

> **Território + Entidades + Localizações + Relações + Eventos + Informação Temporal + Qualidade dos Dados.**

Este é o ponto essencial para evitar que o módulo se transforme, no futuro, numa lista desorganizada de informação difícil de manter.
