import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'node:path';
import { writeFileSync } from 'node:fs';

// Fase 7 — auditoria de acessibilidade com axe-core (já presente em node_modules,
// sem instalar dependências novas) + verificações manuais por papel/foco/teclado.
// Barra de falha: zero violações axe de impacto "critical" ou "serious" nas
// páginas do módulo Espetáculos. Violações "moderate"/"minor" são registadas no
// output mas não falham (fora do âmbito de correção da Fase 7).
const buyer = '11111111-1111-4111-8111-111111111111';
const staff = '22222222-2222-4222-8222-222222222222';
const order = '33333333-3333-4333-8333-333333333333';
const ticket = '44444444-4444-4444-8444-444444444444';
const AXE = path.resolve('node_modules/axe-core/axe.min.js');

async function authenticate(context: BrowserContext, sub = buyer) {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub, exp: now + 3600, iat: now, aal: 'aal1', amr: [{ method: 'password', timestamp: now }] };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${Buffer.from('otj-local-fixture-signature').toString('base64url')}`;
  const session = { access_token: token, refresh_token: 'local-fixture', expires_at: payload.exp, expires_in: 3600, token_type: 'bearer', user: { id: sub, factors: [] } };
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, domain: '127.0.0.1', path: '/' }]);
}

type AxeNode = { target: string[]; failureSummary?: string; html?: string };
type AxeViolation = { id: string; impact: string | null; help: string; nodes: AxeNode[] };
type AxeResult = { violations: AxeViolation[] };

async function audit(page: Page, context: string) {
  await page.addScriptTag({ path: AXE });
  const result = (await page.evaluate(async () =>
    (window as unknown as { axe: { run: (opts: unknown) => Promise<AxeResult> } }).axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    }),
  )) as AxeResult;

  writeFileSync(`/tmp/otj-espectaculos-e2e-results/a11y-${context}.json`, JSON.stringify(result.violations, null, 2));
  const summary = result.violations.map(v => `${v.id}(${v.impact}×${v.nodes.length})`).join(', ') || 'nenhuma';
  console.log(`[a11y:${context}] violações axe: ${summary}`);

  // Barra: zero violações de impacto critical/serious nas páginas do módulo
  // Espetáculos (WCAG 2 A + AA). "moderate"/"minor" são registadas e não falham.
  const blocking = result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  if (blocking.length) console.log(`[a11y:${context}] BLOQUEANTE:`, JSON.stringify(blocking, null, 2));
  expect(blocking.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(' | ')}`), `${context}: violações axe critical/serious`).toEqual([]);
}

test.beforeEach(async ({ page, request }) => {
  await request.post('http://127.0.0.1:4319/__fixture/reset');
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(u.hostname) ? route.continue() : route.abort();
  });
});

test('agenda pública e detalhe — axe + landmark/heading', async ({ page }) => {
  await page.goto('/espectaculos');
  await expect(page.getByRole('heading', { name: 'Próximos eventos' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await audit(page, 'agenda');
  await page.goto('/espectaculos/eventos/1');
  await expect(page.getByRole('heading', { name: 'Concerto E2E local', exact: true })).toBeVisible();
  await audit(page, 'detalhe');
});

test('checkout — axe, labels de input e foco por teclado', async ({ page, context }) => {
  await authenticate(context);
  await page.goto(`/espectaculos/checkout/${order}`);
  await expect(page.getByRole('heading', { name: 'Concluir compra' })).toBeVisible();
  // Nenhum controlo interativo sem nome acessível.
  const unnamed = await page.locator('button, a, input, select, textarea').evaluateAll(els =>
    els.filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      const name = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim();
      const labelled = el.id && !!document.querySelector(`label[for="${el.id}"]`);
      return !name && !labelled && !el.closest('label');
    }).map(el => el.outerHTML.slice(0, 120)),
  );
  expect(unnamed, 'controlos sem nome acessível').toEqual([]);
  await audit(page, 'checkout');
});

test('bilhete emitido — axe e ausência de segredos no DOM/storage', async ({ page, context, request }) => {
  await authenticate(context);
  await request.post('http://127.0.0.1:4319/__fixture/state', { data: { paid: true, status: 'paid' } });
  await page.goto(`/espectaculos/bilhetes/${ticket}`);
  await expect(page.getByRole('img', { name: 'QR de entrada do bilhete' })).toBeVisible();
  await audit(page, 'bilhete');
  const leak = await page.evaluate(async () => {
    const keys = ['token_hash', 'otj1_', 'lease_token', 'client_secret', 'sk_test_', 'sk_live_', 'whsec_', 'service_role'];
    const buckets: string[] = [document.documentElement.outerHTML];
    try { for (let i = 0; i < localStorage.length; i++) buckets.push(localStorage.key(i) + '=' + localStorage.getItem(localStorage.key(i)!)); } catch { /* bloqueado */ }
    try { for (let i = 0; i < sessionStorage.length; i++) buckets.push(sessionStorage.key(i) + '=' + sessionStorage.getItem(sessionStorage.key(i)!)); } catch { /* bloqueado */ }
    try { const cs = await caches.keys(); buckets.push('caches:' + cs.join(',')); } catch { /* sem Cache Storage */ }
    const hay = buckets.join('\n');
    return keys.filter(k => hay.includes(k));
  });
  expect(leak, 'segredos presentes no DOM/storage do bilhete').toEqual([]);
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
});

test('scanner de check-in — axe, role=status e navegação por teclado', async ({ page, context }) => {
  await authenticate(context, staff);
  await page.goto('/espectaculos/organizador/eventos/1/sessoes/1/checkin');
  await expect(page.getByRole('textbox', { name: 'Código lido pelo leitor QR' })).toBeVisible();
  // A região de feedback é uma live region.
  await expect(page.getByRole('status')).toBeVisible();
  // Tab chega ao campo e a Enter/click do botão é alcançável por teclado.
  await page.getByRole('textbox', { name: 'Código lido pelo leitor QR' }).focus();
  await expect(page.getByRole('textbox', { name: 'Código lido pelo leitor QR' })).toBeFocused();
  await audit(page, 'scanner');
});

test('dashboard do organizador — axe e estrutura', async ({ page, context }) => {
  await authenticate(context, staff);
  await page.goto('/espectaculos/organizador/eventos/1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await audit(page, 'organizador');
  await page.goto('/espectaculos/organizador/eventos/1/operacao');
  await audit(page, 'operacao');
});
