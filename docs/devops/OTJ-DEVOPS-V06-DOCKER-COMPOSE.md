# OTJ-DEVOPS-V06 — Docker Compose

**Código:** OTJ-DEVOPS-V06  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** DevOps  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a utilização do Docker Compose no projeto OTJ para orquestrar múltiplos serviços de forma simples, consistente e reproduzível.

---

# Introdução

O Docker Compose permite iniciar, parar e gerir vários contentores através de um único ficheiro de configuração (`docker-compose.yml` ou `compose.yml`).

No OTJ será utilizado para facilitar o desenvolvimento local e ambientes de teste.

---

# Serviços previstos

- Frontend (Next.js)
- Backend (API)
- Base de dados PostgreSQL (quando aplicável)
- Nginx / Reverse Proxy
- Serviços auxiliares

---

# Estrutura recomendada

```text
docker/
├── compose.yml
├── .env
├── frontend/
├── backend/
└── nginx/
```

---

# Configuração

Cada serviço deverá definir:

- Imagem ou Dockerfile
- Portas
- Volumes
- Redes
- Variáveis de ambiente
- Dependências (`depends_on`)

---

# Redes

Os serviços deverão comunicar através de redes Docker dedicadas, evitando exposição desnecessária de portas.

---

# Volumes

Utilizar volumes persistentes para:

- Bases de dados
- Logs
- Ficheiros enviados pelos utilizadores
- Backups temporários

---

# Variáveis de ambiente

As configurações sensíveis devem ser colocadas em ficheiros `.env` e nunca incluídas no repositório.

Exemplos:

- Chaves API
- Palavras-passe
- Tokens
- URLs de serviços

---

# Boas práticas

- Um serviço por contentor.
- Versões explícitas das imagens.
- Reinício automático quando apropriado.
- Separação entre desenvolvimento e produção.
- Configuração documentada.

---

# Benefícios

- Arranque rápido de todo o ambiente.
- Configuração consistente.
- Facilidade de manutenção.
- Maior produtividade da equipa.
- Simplificação do deploy.

---

# Conclusão

O Docker Compose complementa a utilização do Docker no OTJ, permitindo gerir ambientes completos de forma simples, organizada e repetível.

---

**Fim do documento**
