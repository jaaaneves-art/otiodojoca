# OTJ-DEVOPS-V05 — Docker

**Código:** OTJ-DEVOPS-V05  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de utilização do Docker no projeto OTJ, garantindo ambientes consistentes, portabilidade da aplicação e simplificação do processo de desenvolvimento e deploy.

---

# Introdução

O Docker permite empacotar aplicações e respetivas dependências em contentores (containers), assegurando que o software funciona de forma consistente em diferentes ambientes.

No OTJ, o Docker será utilizado para uniformizar o desenvolvimento, os testes e a produção.

---

# Objetivos da utilização do Docker

- Uniformizar os ambientes.
- Eliminar diferenças entre sistemas.
- Facilitar o onboarding de novos programadores.
- Simplificar o deploy.
- Reduzir problemas de configuração.

---

# Componentes principais

## Imagens (Images)

As imagens contêm todos os ficheiros necessários para executar um serviço.

Exemplos:

- Frontend
- Backend
- Serviços auxiliares

---

## Contentores (Containers)

Os contentores são instâncias em execução das imagens.

Cada contentor deverá executar apenas um serviço específico.

---

## Dockerfile

Cada aplicação deverá possuir um `Dockerfile` responsável por definir:

- Sistema base.
- Dependências.
- Configuração.
- Processo de construção.
- Comando de arranque.

---

# Estrutura recomendada

```text
docker/
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
└── nginx/
    └── Dockerfile
```

---

# Boas práticas

- Utilizar imagens oficiais sempre que possível.
- Minimizar o tamanho das imagens.
- Evitar executar processos como utilizador root.
- Definir versões explícitas das imagens base.
- Manter as imagens atualizadas.

---

# Benefícios

- Portabilidade.
- Isolamento.
- Facilidade de distribuição.
- Reprodutibilidade.
- Escalabilidade.

---

# Segurança

A utilização do Docker deverá respeitar os seguintes princípios:

- Atualização regular das imagens.
- Limitação de privilégios.
- Gestão segura de variáveis de ambiente.
- Não inclusão de segredos nas imagens.
- Verificação periódica de vulnerabilidades.

---

# Conclusão

O Docker constitui um elemento fundamental da estratégia DevOps do projeto OTJ, permitindo criar ambientes consistentes, simplificar a infraestrutura e facilitar a manutenção da plataforma.

---

**Fim do documento**
