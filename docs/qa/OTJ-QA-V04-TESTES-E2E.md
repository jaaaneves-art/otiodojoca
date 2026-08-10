# OTJ-QA-V04 — Testes End-to-End (E2E)

**Código:** OTJ-QA-V04  
**Projeto:** O Tio do Joca (OTJ)  
**Área:** Qualidade e Testes (QA)  
**Versão:** 1.0  
**Estado:** Em desenvolvimento

---

# Objetivo

Definir a estratégia de testes End-to-End (E2E) do projeto O Tio do Joca (OTJ), garantindo que os principais fluxos da aplicação funcionam corretamente do ponto de vista do utilizador final.

---

# Conceito

Os testes End-to-End simulam a utilização real da plataforma, verificando a interação entre todos os componentes envolvidos num determinado processo.

O objetivo é validar o comportamento completo da aplicação, desde a interface até aos serviços de backend e à base de dados.

---

# Objetivos

- Validar fluxos completos da aplicação.
- Confirmar o funcionamento das funcionalidades críticas.
- Detetar falhas de integração.
- Reduzir erros em produção.
- Garantir uma boa experiência do utilizador.

---

# Âmbito

Os testes E2E deverão abranger, entre outros:

- Registo de utilizadores.
- Autenticação e encerramento de sessão.
- Gestão do perfil.
- Pesquisa de conteúdos.
- Criação e edição de publicações.
- Gestão de eventos.
- Navegação entre páginas.
- Fluxos administrativos.

---

# Ambiente de Testes

Os testes deverão ser executados num ambiente dedicado, o mais próximo possível da produção, utilizando dados controlados.

---

# Automatização

Sempre que possível, os testes E2E deverão ser automatizados e integrados na pipeline CI/CD.

A execução deverá ocorrer:

- Antes de cada release.
- Após alterações relevantes.
- Periodicamente para deteção de regressões.

---

# Boas Práticas

- Testar apenas os fluxos críticos.
- Evitar dependências desnecessárias.
- Utilizar dados previsíveis.
- Limpar os dados de teste após a execução.
- Manter os testes atualizados com a evolução da aplicação.

---

# Critérios de Aprovação

Uma versão poderá ser considerada apta para produção quando:

- Todos os testes E2E forem aprovados.
- Não existirem falhas críticas.
- Os principais fluxos funcionarem conforme esperado.

---

# Conclusão

Os testes End-to-End constituem a validação final do comportamento da plataforma OTJ, assegurando que a aplicação funciona corretamente na perspetiva dos utilizadores.

---

**Fim do documento**
