<!-- OPF STATE — fonte única de verdade. A IA deve ler este ficheiro antes de qualquer alteração ao projecto. -->
<!-- Actualizado automaticamente por end-session.ps1. Editar apenas através das sessões OPF. -->

# STATE

- **Projecto:** almanaque-comunidade
- **Última sessão:** (nenhuma)
- **Actualizado:** 20260726T0836

---

## Objectivo


O Tio do Joca — plataforma digital colaborativa de preservação e divulgação da cultura, tradições, património e mundo rural português. Módulos principais: portal institucional, fórum, Mercado da Terra, biblioteca digital, almanaque tradicional e enciclopédia rural. Stack: Next.js 14, React 18, TypeScript, Supabase/PostgreSQL, Tailwind.

---

## Estado actual


### Concluído

- Limpeza estrutural 2026-07-26: segredos removidos, configs duplicados resolvidos, gerações antigas arquivadas em `_archive/`, `.gitignore` actualizado.

### Em curso

- Primeiro ciclo de sessão OPF (sessão 20260726T0836 aberta).

### Bloqueado

- (nada)

### Por fazer

- Revogar e regenerar os códigos de recuperação na conta Vercel (acção manual, fora do repositório).
- Rever `_archive/` e decidir o que é eliminado definitivamente.
- Definir a licença do projecto (README diz "A definir").

---

## Próximo passo


Fechar a sessão 20260726T0836 com `.\Sess\scripts\end-session.ps1` para validar o primeiro ciclo completo do sistema OPF.

---

## Decisões


<!-- Decisões técnicas tomadas e o seu porquê. Nunca apagar; apenas acrescentar. -->

- 2026-07-26 — Sistema de sessões OPF (versão mínima em `Sess/`) adoptado como registo oficial; geração antiga (`scripts/` com seis módulos) e sessões antigas movidas para `_archive/`, a remover quando o novo ciclo estiver provado.
- 2026-07-26 — Códigos de recuperação Vercel removidos do repositório; devem ser revogados e regenerados na conta Vercel e guardados fora do projecto.

---

## Tentado e rejeitado

<!-- Abordagens experimentadas e abandonadas, com o motivo. É isto que impede uma IA de repetir caminhos maus. -->

- (nenhum registo)

---

## Armadilhas


<!-- Particularidades do projecto que não são óbvias e já causaram perda de tempo. -->

- Existiam `next.config.js` e `next.config.mjs` em simultâneo com conteúdos diferentes — o Next.js só carrega um, e o `.mjs` (vazio) podia anular a config de imagens do Supabase. Mantido apenas `next.config.js`. O mesmo com `postcss.config.*` (mantido o `.js`, que inclui autoprefixer). Não recriar as variantes `.mjs`.
- O projecto vive em OneDrive: evitar `node_modules` sincronizado (usar `npm install` local e confirmar exclusão de sincronização) para não degradar performance.
- Ficheiros com sufixo `(1)` vindos de downloads do browser podem ser a única cópia e não duplicados — verificar antes de apagar (aconteceu com OTJ-CORE-007 Cap. 06).
