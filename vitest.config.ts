import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Primeira configuração de testes automatizados do projeto (ver
// docs/pendentes/RELATORIO-SESSAO-COWORK-20260826.md, secção 9 —
// "Sem cobertura de teste automatizado", LACUNA-05 da auditoria de 23/08).
//
// Só testes unitários por agora (sem browser, sem base de dados real):
// mockam @/lib/supabase/server e correm em segundos. Testes end-to-end
// (Playwright, contra a UI real) ficam para uma fase seguinte.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'backups'],
  },
  resolve: {
    alias: {
      // Espelha o alias "@/*" -> "./*" definido em tsconfig.json.
      '@': path.resolve(__dirname, '.'),
    },
  },
});
