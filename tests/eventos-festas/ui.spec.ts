import { test, expect, type BrowserContext } from '@playwright/test';
const owner = '11111111-1111-4111-8111-111111111111';
async function authenticate(context: BrowserContext, sub = owner) {
  const now = Math.floor(Date.now() / 1000); const payload = { sub, exp: now + 3600, iat: now, aal: 'aal1', amr: [{ method: 'password', timestamp: now }] };
  const token = `${Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${Buffer.from('local-fixture-signature').toString('base64url')}`;
  const session = { access_token: token, refresh_token: 'fixture', expires_at: payload.exp, expires_in: 3600, token_type: 'bearer', user: { id: sub, factors: [] } };
  await context.addCookies([{ name: 'sb-127-auth-token', value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`, domain: '127.0.0.1', path: '/' }]);
}
test.beforeEach(async ({ page, request }) => {
  await request.post('http://127.0.0.1:4327/__fixture/reset');
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
test('descoberta mobile, pesquisa combinada e perfil público', async ({ page }) => {
  await page.goto('/eventos-festas');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('celebração');
  await page.getByRole('link', { name: /^Casamentos/ }).click();
  await expect(page.getByRole('heading', { name: 'Casamentos', exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Serviço', exact: true }).selectOption('catering');
  await page.getByLabel('Localização', { exact: true }).fill('Lisboa');
  await page.getByLabel('Pessoas (capacidade mínima)').fill('200');
  await page.getByRole('button', { name: 'Pesquisar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quinta Lusa', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Conhecer profissional' }).click();
  await expect(page.getByRole('heading', { name: 'Quinta Lusa', exact: true })).toBeVisible();
  await expect(page.getByText('Empresa ainda não verificada', { exact: false })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('PRIVATE-OWNER');
  await expect(page.locator('body')).not.toContainText(owner);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/eventos-festas-perfil-mobile.png', fullPage: true });
});
test('serviços e áreas principais são navegáveis', async ({ page }) => {
  for (const route of ['aniversarios', 'festas-infantis', 'despedidas', 'eventos-empresariais', 'servicos/fotografia', 'servicos/catering', 'categorias/transportes']) {
    const response = await page.goto(`/eventos-festas/${route}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
test('gestão reutiliza empresa e guarda vários serviços', async ({ page, context }) => {
  await authenticate(context); await page.goto('/eventos-festas/aderir');
  await page.getByRole('link', { name: 'Quinta Lusa — Gerir presença' }).click();
  await expect(page.getByRole('heading', { name: 'Quinta Lusa' })).toBeVisible();
  await page.getByLabel('Filtrar serviços').fill('DJ');
  await page.getByRole('checkbox', { name: 'DJ', exact: true }).check();
  await page.getByRole('button', { name: 'Guardar alterações', exact: true }).click();
  await expect(page.getByRole('main').getByRole('status')).toContainText('Dados guardados');
  await expect(page.getByText('3 selecionados · escolha até 80')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('não responsável não acede ao painel de outra empresa', async ({ page, context }) => {
  await authenticate(context, '22222222-2222-4222-8222-222222222222');
  const response = await page.goto('/eventos-festas/painel/1'); expect(response?.status()).toBe(404);
  await expect(page.locator('input[name="nome"]')).toHaveCount(0);
});
test('visitante é encaminhado para autenticação e serviço indisponível é explícito', async ({ page, request }) => {
  await page.goto('/eventos-festas/aderir'); await expect(page).toHaveURL(/\/login\?/);
  await request.post('http://127.0.0.1:4327/__fixture/unavailable');
  await page.goto('/eventos-festas/empresas'); await expect(page.getByRole('heading', { name: 'Diretório temporariamente indisponível' })).toBeVisible();
});
