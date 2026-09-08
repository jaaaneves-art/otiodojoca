import { spawn } from 'node:child_process';
import { join } from 'node:path';
// Fase 6: arranque simples e robusto do Next para a bateria E2E local.
//
// A Fase 5 usava um root isolado em /tmp com `app`, `lib`, `node_modules`, etc.
// ligados por symlink e chamava `next({ dev: true }).prepare()` num servidor
// HTTP proprio. Em Next 16 o bundler por omissao e o Turbopack, que rejeita um
// symlink de `node_modules` que aponta para fora do seu filesystem root:
//   TurbopackInternalError: Symlink [project]/node_modules is invalid,
//   it points out of the filesystem root
// O erro era um panic nativo que deixava a promise de `prepare()` pendente para
// sempre -> nenhuma suite chegava a arrancar.
//
// Solucao: correr o CLI `next dev` no proprio root do projeto (sem symlinks),
// numa porta dedicada de loopback. O isolamento passa a ser feito por:
//   - distDir dedicado `.next-e2e` (ver next.config.js, guardado por
//     OTJ_ESPECTACULOS_E2E) para nao colidir com o `.next` do dev normal;
//   - env limpa + apontada ao servidor de fixtures local (start.mjs);
//   - network-guard.cjs via NODE_OPTIONS a bloquear qualquer saida externa.
//
// Bundler: `--webpack`. O Turbopack (default do Next 16) ignora o hook
// NEXT_FONT_GOOGLE_MOCKED_RESPONSES e tenta sempre ir a fonts.googleapis.com
// para a fonte Inter de `app/layout.tsx`; com a rede bloqueada isso rebenta em
// `NextFontGoogleCssModuleReplacer` ("url not found") e TODAS as paginas dao
// 500. Com Webpack o mock de fonte e respeitado e a bateria corre 100% offline.
// Ver docs/espectaculos/FASE6-E2E-STRIPE-PREPARACAO-PRODUCAO.md.
const nextBin = join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(
  process.execPath,
  [nextBin, 'dev', '--webpack', '--port', '4318', '--hostname', '127.0.0.1'],
  { stdio: 'inherit', env: process.env },
);
function stop() { child.kill('SIGTERM'); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
child.on('exit', code => process.exit(code ?? 0));
