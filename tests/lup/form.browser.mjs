// Real LUP component in Chromium; action is a controlled double (no database/network writes).
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';

const root = process.cwd();
const dir = await mkdtemp(path.join(tmpdir(), 'otj-lup-form-'));
await build({
  stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
    import {LupAdForm} from './components/lup/lup-ad-form';
    window.calls=[]; window.release=null;
    async function action(data) {
      window.calls.push(Object.fromEntries(data));
      await new Promise(resolve=>window.release=resolve);
      return {error:'Falha controlada: tente novamente.'};
    }
    createRoot(document.getElementById('root')).render(<LupAdForm categories={[{id:1,name:'Humano'}]}
      municipios={[{nome:'Braga',distrito_regiao:'Braga'}]} action={action} />);`,
    resolveDir: root, loader: 'tsx' },
  bundle: true, outfile: path.join(dir, 'app.js'), platform: 'browser', jsx: 'automatic',
  tsconfig: path.join(root, 'tsconfig.json'), define: { 'process.env.NODE_ENV': '"development"' },
});
await writeFile(path.join(dir, 'index.html'), '<div id="root"></div><script src="/app.js"></script>');
const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', req.url === '/app.js' ? 'text/javascript' : 'text/html');
  res.end(await readFile(path.join(dir, req.url === '/app.js' ? 'app.js' : 'index.html')));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('input[name=title]').fill('Excedentes');
  await page.locator('textarea[name=description]').fill('Descrição');
  await page.locator('select[name=categoryId]').selectOption('1');
  await page.locator('input[name=quantity]').fill('2');
  await page.locator('input[name=unit]').fill('kg');
  await page.locator('input[name=pickupEndsAt]').fill('2027-01-01T12:00');
  // Dispatch twice in the same event loop: tests the ref guard before React rerenders.
  await page.locator('form').evaluate(form => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => window.calls.length === 1);
  assert.equal(await page.locator('button[type=submit]').isDisabled(), true);
  assert.match(await page.locator('button[type=submit]').innerText(), /A guardar/);
  const first = await page.evaluate(() => window.calls[0]);
  assert.match(first.request_id, /^[a-f0-9-]{36}$/);
  assert.match(first.pickupEndsAt, /Z$/);
  await page.evaluate(() => window.release());
  await page.getByRole('alert').waitFor();
  assert.equal(await page.locator('button[type=submit]').isEnabled(), true);
  await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true })));
  await page.waitForFunction(() => window.calls.length === 2);
  assert.equal(await page.evaluate(() => window.calls[1].request_id), first.request_id);
  await page.evaluate(() => window.release());
  console.log('PASS Chromium 390x844: immediate double-submit guard, sending/disabled state, error feedback, stable retry UUID, UTC dates. Action double only.');
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
