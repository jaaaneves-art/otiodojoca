# Pendente — Analisar o JobNex e decidir se/como aproveitar — MVP completo 30/08/2026 22:13

**Atualização 30/08 22:13:** Fases 3 a 9 todas feitas (perfil de candidato, empresas, pesquisa/listagem, candidaturas, matching, admin/moderação, alertas de emprego). Roadmap do MVP fechado (secção 6 de `docs/EMPREGOS.md`) mais a primeira funcionalidade pós-MVP. Este documento passa a histórico da decisão inicial — o estado atual e os pendentes reais estão em `claude/RELATORIO-COMPLETO-20260830.md` e `docs/pendentes/EMPREGOS-DEPLOY-VERCEL-JJ-20260830.md`.

**Decisão tomada:** módulo novo "Empregos" dentro do OTJ (não standalone), ligado a freguesias/municípios. Nome provisório do módulo: **JobNex**. Auditoria (Fase 0), arquitetura (Fase 1) e base de dados (Fase 2) feitas — Fase 2 testada localmente (`supabase db reset`) e aplicada em produção (`supabase db push`) pelo Yos.

## Como se chegou aqui

1. Registado 29/08 como pendente sem destino definido.
2. 30/08 manhã: contradição entre "módulo OTJ" (resposta original) e um prompt de 43 secções a pedir plataforma standalone — resolvida a favor de "módulo OTJ" pelo Yos. Também decidido fazer só Fase 0+1 nessa altura (sem terminal disponível na sessão).
3. 30/08 13:20: Yos confirma manter "JobNex" como nome provisório e pede para avançar — Fase 2 (base de dados) escrita.
4. 30/08 tarde: Yos testou a migration no seu computador (CLI do Supabase instalada via `npm install -D supabase`, Docker já estava presente) — `supabase db reset` local aplicou sem erros, testes manuais confirmaram os CHECKs alargados a funcionar corretamente (aceitam `'empregador'`/`'estimativa'`/`'empresa'`, rejeitam valores inválidos). `supabase db push` aplicado em produção com sucesso.
5. 30/08 19:53–21:01: Fases 6 a 9 escritas e documentadas (`docs/EMPREGOS.md` secções 12–15).
6. 30/08 21:19–22:13: primeira aplicação real das migrations pendentes, primeiro commit/push de todo o código do módulo, primeiro build/deploy a sério na Vercel — ver `claude/RELATORIO-COMPLETO-20260830.md` para a narrativa completa (incluindo dois bugs de build genuínos encontrados e corrigidos, e a descoberta de dois projetos Vercel duplicados).

## Estado atual da base de dados (produção)

Todas as migrations do módulo (Fase 2, Fase 8, Fase 9) aplicadas em produção via `supabase db push`. Detalhes completos em `docs/EMPREGOS.md` secções 8, 14 e 15.

## Por decidir / confirmar

1. ~~Nome definitivo de exibição do módulo~~ — resolvido: "JobNex" por agora.
2. Confirmar se "ligar a freguesias/municípios" é só localização da vaga, ou também câmaras/juntas a publicarem vagas como entidade empregadora — ainda em aberto, mas a base de dados já cobre os dois casos.
3. ~~Terminal ligado ao computador do Yos~~ — resolvido: o Yos corre os comandos diretamente no seu terminal (local e, desde hoje, também deploy na Vercel), colando os resultados de volta.

## Próximos passos

Não há mais fases de desenvolvimento planeadas no MVP — está completo. O que falta é operacional: resolver o erro 500 do endpoint de alertas em produção e testar o módulo inteiro em browser (ver `docs/pendentes/EMPREGOS-DEPLOY-VERCEL-JJ-20260830.md`). Depois disso, as outras duas ideias pós-MVP (dados salariais estruturados, avaliações de empresa) ficam por priorizar quando o Yos quiser avançar.

---

# Documento original — 29/08/2026 (para histórico)

Segundo projeto de demo enviado pelo Yos (depois do AutoNex): JobNex — marketplace de emprego, front-end puro, ~1030 linhas, sem backend. Ao contrário do AutoNex (destino já definido: StandGo), o JobNex não tinha destino definido — perguntar se é módulo novo ou só inspiração. Nota: dados mock com nomes de empresas portuguesas reais, trocar antes de publicação.
