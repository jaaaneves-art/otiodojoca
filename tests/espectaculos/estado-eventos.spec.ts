import { test, expect } from '@playwright/test';

// Fase 7 — estados de evento na área pública.
// Espelha as RPC reais: event_upcoming (só estado='publicado') e
// event_public_detail (estado in 'publicado'/'cancelado'); event_reserve recusa
// qualquer sessão cujo evento não esteja 'publicado' (migration
// 20260907102000, linha "e.estado<>'publicado' ... raise 'Sessão indisponível.'").
test.beforeEach(async ({ page, request }) => {
  await request.post('http://127.0.0.1:4319/__fixture/reset');
  await page.route('**/*', route => {
    const u = new URL(route.request().url());
    return ['127.0.0.1', 'localhost'].includes(u.hostname) ? route.continue() : route.abort();
  });
});

test('draft event is absent from the public agenda and its detail is not public', async ({ page }) => {
  await page.goto('/espectaculos');
  await expect(page.getByRole('heading', { name: 'Próximos eventos' })).toBeVisible();
  // Publicado presente, rascunho nunca listado.
  await expect(page.getByRole('link', { name: /Concerto E2E local/ })).toBeVisible();
  await expect(page.getByText('Rascunho E2E local')).toHaveCount(0);

  const response = await page.goto('/espectaculos/eventos/2');
  // `next dev` responde 200 ao render de notFound(); `next build`+`start` responde
  // 404. Aceitam-se ambos, desde que o conteúdo seja a página "não encontrado" e
  // nada do evento rascunho (nem caminho de venda) esteja acessível.
  const body = await page.content();
  expect(response?.status() === 404 || /não encontrad|not found|404/i.test(body)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Rascunho E2E local' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Sessões e bilhetes' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registar participação' })).toHaveCount(0);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
});

test('cancelled event stays addressable, is clearly marked and cannot be reserved', async ({ page }) => {
  const response = await page.goto('/espectaculos/eventos/3');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Espetáculo cancelado E2E', exact: true })).toBeVisible();
  // Estado cancelado apresentado de forma clara e anunciável (live region).
  await expect(page.getByRole('status')).toContainText(/Evento cancelado/i);
  await expect(page.getByText('Cancelada')).toBeVisible();
  // Sem qualquer caminho de venda/reserva na sessão cancelada.
  await expect(page.getByRole('button', { name: 'Registar participação' })).toHaveCount(0);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);

  // Defesa em profundidade: a própria RPC de reserva recusa a sessão do evento cancelado.
  const reserve = await page.request.post('http://127.0.0.1:4319/rest/v1/rpc/event_reserve', {
    headers: { Authorization: 'Bearer header.eyJzdWIiOiIxMTExMTExMS0xMTExLTQxMTEtODExMS0xMTExMTExMTExMTEifQ.sig', 'Content-Type': 'application/json' },
    data: { p_session: 3, p_items: [{ ticket_type_id: 1, quantity: 1 }], p_key: '99999999-9999-4999-8999-999999999999' },
  });
  expect(reserve.status()).toBe(400);
  expect(await reserve.text()).toContain('Sessão indisponível');
});
