# Plano de prioridades — a partir de 07/09/2026

**Preparado em:** 07/09/2026
**Base:** `docs/pendentes/PLANO-TRABALHO-20260907.md` — mesmos itens, aqui ordenados por importância (impacto e risco) em vez de por sequência de execução
**Fora desta lista, por pedido explícito:** Espetáculos

---

## Ordem de mais para menos importante

1. **Camada de Adesões** — bloqueia dois módulos inteiros ao mesmo tempo (Educação e continuação do Escutismo). Prioridade alta na origem. Nada do resto no núcleo do projeto avança sem isto.
2. **SendGrid — teste ponta a ponta** — 30 minutos que desbloqueiam o Sprint 10 e a Fase 4 do Escutismo. Não é "importante" em si, mas o custo é tão baixo face ao que liberta que fica logo a seguir ao bloqueador maior.
3. **Segurança / Sprint 10 — fechar o que falta** — já há buracos reais em produção (role/status legíveis por qualquer visitante, sem trigger a proteger `role`, RLS de `marketplace_ads` por separar). Prioridade alta na origem; é risco de segurança já ativo, não hipotético.
4. **RGPD de dados de menores** — três módulos vão tratar dados de crianças identificadas; um deles já recolhe dados de saúde. É decisão de risco legal, não de código, e por isso não aparece como "bloco de trabalho" — mas deve abrir-se em paralelo com os itens acima, antes de qualquer módulo avançar para dados reais.
5. **Empregos — resolver o deploy** — erro 500 ativo num endpoint de produção; decisão de apagar o projeto Vercel duplicado já tomada, só falta executar. Bug real e isolado, vale a pena fechá-lo cedo em vez de o deixar arrastar.
6. **Escutismo Fase 2 em diante** — módulo com mais investimento já feito (Fase 1 aplicada e testada) e que lida com dados de menores. Depende do item 1.
7. **Educação sobre Adesões** — mesma dependência do item 1, mas uma fase atrás do Escutismo: ainda em desenho, nada escrito.
8. **Botão de editar nos módulos restantes** — bug real e visível: quem publica um anúncio em 4 dos 5 módulos não o consegue corrigir. Isolado e rápido (1–2h), mas afeta utilizadores desde já.
9. **Universidades — reconciliar com Adesões** — mesmo problema estrutural que a Educação tinha, mas ainda nem o desenho está fechado. Vale escrever antes de tocar em SQL, para não repetir trabalho perdido, mas não é urgente.
10. **StandGo/AutoNex** — à espera do Yos testar no browser e escolher o nome. Sem código novo a fazer até essa decisão.
11. **Arrumar os 28 SQL soltos em `~/Transferências`** — risco operacional real (correr o script errado em produção) mas baixo esforço para mitigar.
12. **Reorganização de `docs/`** (decisoes/estudos/guias) — baixa prioridade declarada na origem, não bloqueia código.
13. **PHASE7 Alojamento** (reservas 404, checklist E2E) — antes de alocar tempo, confirmar se ainda é reprodutível; pode já estar resolvido por trabalho posterior.
14. **Módulo Freguesia**, Fases E e F — aberto desde 19/08, sem ficheiro revisto nesta ronda.
15. **`supabase db diff` não configurado** — baixa prioridade declarada na origem, não bloqueia nada.
16. **OAuth social login** — parado por decisão consciente do Yos (à espera de domínio definitivo). Sem ação até lá.
17. **Branch `origin/docs-audit`** — precisa de auditoria própria antes de qualquer decisão; não é trabalho ativo.

Fora desta lista: **Espetáculos**, excluído do plano a pedido.
