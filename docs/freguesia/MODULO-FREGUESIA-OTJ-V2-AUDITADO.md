# MÓDULO FREGUESIA — OTJ
## Especificação Funcional e Arquitectural Auditada — Versão 2.0

**Estado:** Proposta auditada e aprofundada  
**Objectivo:** Definir uma base sólida, reutilizável e escalável para representar digitalmente as freguesias portuguesas no OTJ.

---

# 1. VISÃO

O módulo **Freguesia** deve transformar cada freguesia numa porta de entrada para a sua comunidade.

Não é apenas um directório de contactos e não é apenas uma página institucional. Deve permitir organizar, relacionar e apresentar informação sobre:

- administração pública;
- instituições;
- paróquias e património religioso;
- associações;
- escuteiros e juventude;
- comissões de festas;
- cultura, folclore e tradições;
- desporto;
- educação;
- economia;
- indústria;
- comércio;
- serviços;
- saúde e apoio social;
- farmácias e respectivos horários;
- hotelaria, restauração e turismo;
- equipamentos e espaços locais;
- eventos e actividades.

O princípio central é:

> **Uma freguesia é um território. As entidades pertencem ou actuam nesse território. Os eventos acontecem num tempo e num lugar.**

Esta separação deve orientar todo o modelo.

---

# 2. AUDITORIA CONCEPTUAL — PRINCIPAIS CORRECÇÕES À VERSÃO ANTERIOR

A versão anterior estabelecia correctamente as principais categorias, mas existiam pontos que necessitavam de maior rigor.

## 2.1. Faltava separar melhor território, entidade e estabelecimento

Exemplos:

- uma associação é uma entidade;
- a sua sede é uma localização ou estabelecimento;
- uma festa é um evento;
- a Comissão de Festas é uma entidade organizadora;
- uma escola pode ser um estabelecimento;
- um Agrupamento de Escolas é uma entidade organizacional;
- uma empresa é uma entidade;
- uma fábrica ou loja pode ser um estabelecimento dessa empresa.

O sistema não deve obrigar todas estas realidades a caberem no mesmo campo.

## 2.2. Faltava uma classificação transversal mais robusta

Não basta ter apenas `categoria` e `subcategoria`.

Deve ser possível distinguir:

- tipo de entidade;
- área temática;
- actividade;
- natureza jurídica ou organizacional, quando relevante;
- estatuto de publicação;
- território;
- localização física.

## 2.3. Faltava governança e origem da informação

É essencial saber:

- quem criou um registo;
- quem o actualizou;
- qual a fonte;
- quando foi verificado;
- quando deve voltar a ser revisto;
- se foi confirmado pela própria entidade;
- se a informação é pública ou pendente de validação.

Isto é particularmente importante para:

- farmácias;
- horários;
- serviços;
- contactos;
- eventos;
- instituições públicas.

## 2.4. Faltava separar horário regular de excepções

Uma entidade pode ter:

- horário semanal regular;
- horário especial de Verão;
- horário de Natal;
- horário de feriados;
- encerramento temporário.

Uma Farmácia pode ainda ter:

- horário normal;
- período de serviço;
- turno extraordinário.

Estas informações não devem ser confundidas.

## 2.5. Faltava definir relações entre entidades

Exemplos:

- Escola → pertence a → Agrupamento;
- Comissão de Festas → organiza → Evento;
- Rancho → participa em → Evento;
- Paróquia → utiliza/está associada a → Igreja;
- Empresa → possui → Estabelecimento;
- Associação → tem sede em → Localização;
- Entidade → serve/actua em → Freguesia.

Estas relações devem ser modeladas sem criar campos específicos para cada caso.

---

# 3. PRINCÍPIOS ARQUITECTURAIS

1. **Auditar antes de criar.**
2. **Reutilizar antes de duplicar.**
3. **Generalizar apenas quando existe uma necessidade real.**
4. **Separar dados permanentes de dados temporais.**
5. **Separar entidade de estabelecimento e localização.**
6. **Separar evento de organizador.**
7. **Utilizar a hierarquia geográfica já existente no projecto.**
8. **Utilizar o sistema de calendário já existente.**
9. **Não criar um sistema paralelo de pesquisa.**
10. **Não alterar a arquitectura OTJ 1.0 sem necessidade.**
11. **Implementar migrações seguras e reversíveis quando aplicável.**
12. **Preservar dados existentes.**
13. **Não recriar ficheiros existentes.**
14. **Nunca utilizar `type nul > ficheiro` em ficheiros existentes.**
15. **Criar apenas ficheiros em falta com verificação prévia, como `if not exist`.**
16. **Toda a informação temporal importante deve ser datável.**
17. **Toda a informação crítica deve ter origem e data de verificação quando possível.**

---

# 4. MODELO CONCEPTUAL

## 4.1. Território

Hierarquia preferencial:

```text
Portugal
├── Região Autónoma
│   └── Ilha / Concelho
└── Distrito
    └── Concelho
        └── Freguesia
            └── Localidade / Lugar (quando aplicável)
                └── Localização
```

A estrutura real deve reutilizar o modelo geográfico já existente no projecto.

Não criar uma segunda tabela geográfica sem necessidade.

## 4.2. Entidade

Uma **Entidade** representa uma organização, instituição, grupo ou actor identificável.

Exemplos:

- Junta de Freguesia;
- Paróquia;
- Agrupamento de Escuteiros;
- Comissão de Festas;
- Rancho Folclórico;
- Clube;
- Escola;
- Agrupamento de Escolas;
- Empresa;
- IPSS;
- Farmácia.

## 4.3. Estabelecimento ou unidade

Representa um local físico onde uma entidade funciona ou presta actividade.

Exemplos:

- loja;
- fábrica;
- sede;
- escola;
- clínica;
- restaurante;
- farmácia.

Uma entidade pode ter zero, um ou vários estabelecimentos.

## 4.4. Localização

Representa o ponto geográfico ou morada.

Pode incluir:

- morada;
- código postal;
- freguesia;
- coordenadas;
- instruções de acesso;
- acessibilidade.

## 4.5. Evento

Representa algo que acontece num período de tempo.

Exemplos:

- festa;
- romaria;
- procissão;
- torneio;
- festival;
- feira;
- concerto;
- actividade escolar.

## 4.6. Período de serviço

Representa informação temporal operacional.

Exemplos:

- Farmácia de Serviço;
- horário excepcional;
- encerramento temporário;
- serviço especial.

---

# 5. ESTRUTURA FUNCIONAL DA FREGUESIA

```text
FREGUESIA
│
├── Conhecer
│   ├── Informação geral
│   ├── História e património
│   ├── Locais e equipamentos
│   └── Contactos úteis
│
├── Comunidade
│   ├── Administração Pública
│   ├── Paróquia e Vida Religiosa
│   ├── Associações
│   ├── Escuteiros e Juventude
│   ├── Comissões de Festas
│   └── Voluntariado
│
├── Cultura e Desporto
│   ├── Ranchos e Folclore
│   ├── Bandas e Música
│   ├── Cultura
│   ├── Clubes
│   └── Lazer
│
├── Educação
│   ├── Estabelecimentos
│   ├── Agrupamentos
│   └── Formação
│
├── Economia Local
│   ├── Indústria
│   ├── Agricultura e Produção
│   ├── Comércio
│   └── Serviços
│
├── Saúde e Apoio
│   ├── Farmácias
│   ├── Farmácia de Serviço
│   ├── Saúde
│   └── Apoio Social
│
└── Visitar e Viver
    ├── Restauração
    ├── Alojamento
    ├── Turismo
    ├── Património
    └── Percursos
```

---

# 6. CATEGORIAS E SUBCATEGORIAS

## 6.1. Administração e Instituições Públicas

- Junta de Freguesia;
- Assembleia de Freguesia;
- serviços públicos;
- equipamentos públicos;
- espaços municipais relevantes;
- protecção e segurança, quando existirem entidades ou equipamentos locais;
- contactos úteis institucionais.

## 6.2. Paróquia e Vida Religiosa

- Paróquia;
- Igreja;
- Capela;
- Santuário;
- Confraria;
- Irmandade;
- Grupo paroquial;
- património religioso.

## 6.3. Comunidade e Associativismo

- associação local;
- colectividade;
- associação de moradores;
- associação juvenil;
- grupo de jovens;
- agrupamento de escuteiros;
- voluntariado;
- organização comunitária;
- Comissão de Festas.

## 6.4. Cultura

- Rancho Folclórico;
- grupo etnográfico;
- banda filarmónica;
- banda de música;
- coro;
- grupo musical;
- grupo de teatro;
- associação cultural;
- artesão;
- espaço cultural.

## 6.5. Desporto e Lazer

- clube desportivo;
- associação desportiva;
- escola de desporto;
- equipa;
- ginásio;
- instalação desportiva;
- percurso;
- espaço de lazer.

## 6.6. Educação

- creche;
- jardim de infância;
- escola básica;
- escola secundária;
- escola profissional;
- estabelecimento de ensino;
- Agrupamento de Escolas;
- centro de formação;
- associação de pais;
- biblioteca ou recurso educativo.

## 6.7. Economia Local

### Indústria e produção
- fábrica;
- indústria;
- oficina de produção;
- construção;
- agricultura;
- agro-indústria;
- zona industrial.

### Comércio
- mercearia;
- supermercado;
- padaria;
- pastelaria;
- talho;
- peixaria;
- florista;
- papelaria;
- vestuário;
- ferragens;
- comércio especializado.

### Serviços
- banco ou instituição financeira;
- CTT ou serviço postal;
- seguros;
- contabilidade;
- advocacia;
- solicitadoria;
- imobiliária;
- oficina automóvel;
- electricista;
- canalizador;
- limpeza;
- informática;
- cabeleireiro;
- estética;
- serviço funerário.

## 6.8. Saúde e Apoio

- Farmácia;
- clínica;
- consultório;
- medicina;
- medicina dentária;
- fisioterapia;
- enfermagem;
- laboratório;
- veterinário;
- IPSS;
- apoio domiciliário;
- centro de dia.

## 6.9. Hotelaria, Restauração e Turismo

### Alojamento
- hotel;
- pensão;
- turismo rural;
- alojamento local;
- casa de hóspedes.

### Restauração
- restaurante;
- tasca;
- café;
- pastelaria;
- snack-bar;
- take-away.

### Turismo
- ponto de interesse;
- monumento;
- museu;
- património;
- rota;
- percurso;
- experiência local.

---

# 7. COMISSÕES DE FESTAS

As Comissões de Festas devem possuir tratamento explícito.

## Dados permanentes

- nome;
- descrição;
- freguesia;
- contactos públicos;
- localização ou sede, quando aplicável;
- fotografias;
- história e tradição;
- canais oficiais;
- estado.

## Relações

Uma Comissão pode:

- organizar vários eventos;
- colaborar com outras entidades;
- estar associada a uma tradição;
- actuar em mais do que uma edição da mesma festa.

## Regra

**A Comissão não é o evento.**

Exemplo:

```text
Comissão de Festas de São X
        │
        ├── organiza → Festa de São X 2026
        ├── organiza → Festa de São X 2027
        └── organiza → Arraial de Verão 2027
```

Cada edição deve ser tratada como evento próprio quando as datas, programa ou informação variam.

---

# 8. FARMÁCIAS — ESPECIFICAÇÃO ESPECIAL

As Farmácias devem ter uma área própria e facilmente acessível.

## 8.1. Informação permanente

- nome;
- contactos;
- morada;
- código postal;
- freguesia;
- localização;
- serviços;
- acessibilidade;
- estado.

## 8.2. Horário regular

O horário deve suportar:

- dia da semana;
- hora de abertura;
- hora de fecho;
- múltiplos períodos no mesmo dia;
- indicação de encerramento.

Exemplo:

```text
Segunda-feira
09:00–13:00
14:00–19:00
```

Não assumir que todas as farmácias possuem um único período diário.

## 8.3. Excepções

Deve ser possível registar:

- feriados;
- horário especial;
- horário sazonal;
- encerramento temporário;
- alterações extraordinárias.

Cada excepção deve ter:

- início;
- fim;
- motivo ou tipo;
- horário aplicável;
- origem/verificação, quando disponível.

## 8.4. Farmácia de Serviço

O sistema deve suportar períodos de serviço com:

- Farmácia;
- início;
- fim;
- tipo de serviço, se necessário;
- território ou área de cobertura;
- origem da informação;
- data de verificação;
- estado de validação.

## 8.5. Consultas prioritárias

A interface deve permitir:

- **Farmácia de Serviço Agora**;
- Farmácia de Serviço Hoje;
- Farmácia de Serviço Amanhã;
- consulta por data;
- calendário de serviço;
- farmácias da freguesia;
- farmácias próximas, usando localização quando disponível.

## 8.6. Regra de segurança informativa

A informação de serviço e horários não deve ser apresentada como garantida se estiver desactualizada ou sem fonte verificável.

Sempre que aplicável, o sistema deve poder indicar:

- data da última verificação;
- fonte;
- necessidade de confirmação.

---

# 9. HORÁRIOS — MODELO TRANSVERSAL

O módulo deve considerar que horários são um problema geral, não exclusivo das Farmácias.

Restaurantes, lojas, serviços e instituições também podem ter:

- horário semanal;
- períodos múltiplos;
- excepções;
- encerramentos.

Sempre que possível, criar ou reutilizar um modelo de horário transversal.

O objectivo é evitar:

- uma solução de horários para Farmácias;
- outra para Restaurantes;
- outra para Comércio.

Deve existir especialização apenas quando houver uma necessidade funcional real, como os turnos de serviço das Farmácias.

---

# 10. RELAÇÕES ENTRE ENTIDADES

Deve existir uma forma reutilizável de representar relações.

Exemplos:

```text
Escola ── pertence a ──> Agrupamento
Comissão ── organiza ──> Evento
Rancho ── participa em ──> Evento
Empresa ── possui ──> Estabelecimento
Entidade ── tem sede em ──> Localização
Entidade ── actua em ──> Freguesia
Paróquia ── está associada a ──> Igreja
```

Não criar uma coluna nova para cada tipo de relação.

---

# 11. DADOS, FONTES E VALIDAÇÃO

Cada informação importante deve poder ter metadados de qualidade.

Campos ou mecanismos equivalentes:

- origem;
- URL ou referência da fonte, quando existir;
- data de recolha;
- data da última verificação;
- estado de validação;
- responsável pela actualização;
- data prevista para nova revisão, quando necessário.

Estados sugeridos:

- rascunho;
- pendente de validação;
- validado;
- publicado;
- desactualizado;
- arquivado.

A implementação deve respeitar a arquitectura de autenticação, permissões e moderação já existente.

---

# 12. PROPRIEDADE E GESTÃO DA INFORMAÇÃO

O sistema deve prever diferentes papéis, conforme a arquitectura existente permitir:

- administrador da plataforma;
- administrador ou gestor territorial;
- representante verificado de entidade;
- editor;
- utilizador.

O objectivo não é dar automaticamente a qualquer entidade controlo sobre toda a freguesia.

Exemplo:

- uma Comissão gere a sua própria informação;
- uma Farmácia pode solicitar actualização da sua ficha;
- uma associação pode gerir os seus eventos;
- a Junta pode gerir a sua informação institucional.

As regras exactas de permissões devem reutilizar o sistema existente.

---

# 13. PESQUISA E DESCOBERTA

A pesquisa deve poder evoluir para responder a perguntas como:

- Farmácia de serviço hoje;
- Farmácias em determinada freguesia;
- Restaurantes perto de um local;
- Eventos este fim-de-semana;
- Ranchos folclóricos de um concelho;
- Escolas pertencentes a um Agrupamento;
- Comissões de Festas activas;
- Empresas de determinado sector.

Filtros importantes:

- território;
- categoria;
- subcategoria;
- entidade;
- estado;
- data;
- proximidade, quando suportada.

---

# 14. PÁGINA DA FREGUESIA

A página de uma freguesia deve poder apresentar blocos de informação sem obrigar a mostrar tudo.

Sugestão:

```text
[NOME DA FREGUESIA]

Hoje na Freguesia
- Farmácia de Serviço
- Próximos eventos
- Avisos relevantes

Conhecer
- História
- Património
- Locais e equipamentos

Comunidade
- Junta
- Paróquia
- Associações
- Escuteiros
- Comissões de Festas

Cultura e Desporto
- Ranchos
- Bandas
- Clubes

Educação
- Escolas
- Agrupamentos

Economia Local
- Indústria
- Comércio
- Serviços

Saúde e Apoio
- Farmácias
- Saúde
- Apoio Social

Visitar e Viver
- Comer
- Dormir
- Visitar
- Percursos
```

A página deve funcionar como ponto de descoberta e não como uma simples lista interminável.

---

# 15. INTEGRAÇÃO COM O CALENDÁRIO

As entidades são permanentes.

Os eventos e períodos de serviço são temporais.

Exemplos:

```text
ENTIDADE: Comissão de Festas
    ↓ organiza
EVENTO: Festa Anual 2026
    ↓ ocorre em
PERÍODO: 12–16 Agosto 2026
    ↓ acontece em
LOCALIZAÇÃO
```

Para Farmácias:

```text
ENTIDADE: Farmácia
    ↓ possui
PERÍODO DE SERVIÇO
    ↓ válido entre
INÍCIO e FIM
```

Não duplicar eventos ou turnos em tabelas específicas se o sistema temporal existente puder ser correctamente reutilizado.

---

# 16. REQUISITOS DE QUALIDADE

## Funcionais

- dados pesquisáveis;
- entidades associáveis a territórios;
- eventos ligados a entidades;
- horários estruturados;
- excepções temporais;
- Farmácia de Serviço consultável por data;
- relações entre entidades;
- categorias extensíveis.

## Técnicos

- evitar N+1 e consultas desnecessárias;
- indexar campos de pesquisa e relações relevantes;
- validar datas e períodos;
- impedir períodos inválidos;
- impedir relações duplicadas quando aplicável;
- preservar integridade referencial;
- aplicar RLS e permissões de acordo com a arquitectura existente;
- não expor dados pessoais sem fundamento.

## Dados

- evitar duplicados;
- permitir fusão ou associação de registos duplicados, se o sistema evoluir para isso;
- guardar estado de validação;
- manter rastreabilidade de alterações relevantes.

---

# 17. AUDITORIA TÉCNICA OBRIGATÓRIA ANTES DA IMPLEMENTAÇÃO

Antes de qualquer migração ou criação de componentes, responder documentalmente:

1. Já existe uma tabela ou modelo de entidades?
2. Já existe uma tabela ou modelo de categorias?
3. Já existe uma estrutura de relações entre entidades?
4. Já existe sistema de localização?
5. Já existe hierarquia freguesia → concelho → distrito/região?
6. Já existe sistema de eventos?
7. Já existe sistema de horários?
8. Já existe sistema de imagens?
9. Já existe pesquisa?
10. Já existem papéis e permissões?
11. Que componentes podem ser reutilizados?
12. Que partes do Mercado da Terra podem ser relacionadas sem serem duplicadas?
13. Que tabelas precisam realmente de ser alteradas?
14. Que novas tabelas são indispensáveis?

Nenhuma resposta deve ser assumida sem auditoria do repositório e da base de dados.

---

# 18. PLANO DE IMPLEMENTAÇÃO RECOMENDADO

## Fase A — Auditoria

- inventário da arquitectura;
- inventário da base de dados;
- mapa de entidades existentes;
- mapa das relações;
- análise de localização;
- análise de calendário;
- análise de horários;
- análise de permissões.

## Fase B — Modelo mínimo

Implementar apenas as lacunas indispensáveis para:

- Freguesia;
- entidades;
- categorias;
- relações;
- localizações;
- eventos;
- horários;
- Farmácias.

## Fase C — Vertical de teste

Escolher uma freguesia piloto e testar o ciclo completo com exemplos reais:

- Junta;
- Paróquia;
- Escuteiros;
- Comissão de Festas;
- Rancho ou associação cultural;
- Clube;
- Escola;
- Empresa;
- comércio;
- serviço;
- Farmácia;
- restaurante.

## Fase D — Validação

Testar:

- criação;
- edição;
- publicação;
- pesquisa;
- localização;
- relações;
- calendário;
- horários;
- excepções;
- Farmácia de Serviço;
- permissões;
- duplicação.

## Fase E — Expansão

Só depois do piloto estar estável:

- concelho;
- múltiplas freguesias;
- restantes territórios.

---

# 19. CRITÉRIOS DE ACEITAÇÃO DO MVP

O módulo pode ser considerado funcional quando for possível:

1. consultar uma freguesia;
2. listar entidades por categoria;
3. abrir uma ficha de entidade;
4. associar correctamente uma entidade a uma freguesia;
5. relacionar entidades entre si;
6. criar eventos ligados a entidades;
7. apresentar eventos no calendário;
8. guardar horários regulares;
9. guardar excepções de horário;
10. identificar a Farmácia de Serviço para uma data;
11. apresentar claramente a Farmácia de Serviço actual;
12. pesquisar informação por território e categoria;
13. impedir duplicações evidentes;
14. respeitar permissões e RLS;
15. manter a integração com a arquitectura existente.

---

# 20. DECISÕES A NÃO TOMAR SEM AUDITORIA

Não decidir antecipadamente:

- nomes finais das tabelas;
- nomes finais das rotas;
- nomes dos componentes;
- criação de novas APIs;
- criação de novos sistemas de geocodificação;
- criação de novo motor de pesquisa;
- criação de novo calendário;
- criação de novo sistema de horários;
- criação de novos papéis de utilizador.

Estas decisões dependem do que já existe no OTJ.

---

# 21. OBJECTIVO FINAL

Construir uma estrutura em que cada freguesia portuguesa possa ser representada como uma **comunidade organizada, pesquisável e viva**, ligando território, entidades, serviços, cultura, economia e acontecimentos.

O módulo deve permitir crescer sem transformar o projecto numa colecção de tabelas isoladas.

A regra orientadora é:

> **Uma única fonte de verdade para cada conceito, relações explícitas entre conceitos e informação temporal tratada como informação temporal.**

