import { test, expect, type BrowserContext } from '@playwright/test';
import path from 'node:path';
const buyer='11111111-1111-4111-8111-111111111111', staff='22222222-2222-4222-8222-222222222222';
const order='33333333-3333-4333-8333-333333333333',ticket='44444444-4444-4444-8444-444444444444';
async function authenticate(context: BrowserContext, sub=buyer) {
 const payload={sub,exp:Math.floor(Date.now()/1000)+3600,iat:Math.floor(Date.now()/1000),aal:'aal1',amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)}]};
 // Signature segment must be valid base64url or @supabase/ssr's local JWT decode
 // (middleware AAL check) throws AuthInvalidJwtError and every page 500s.
 const token=`${Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${Buffer.from('otj-local-fixture-signature').toString('base64url')}`;
 const session={access_token:token,refresh_token:'local-fixture',expires_at:payload.exp,expires_in:3600,token_type:'bearer',user:{id:sub,factors:[]}};
 await context.addCookies([{name:'sb-127-auth-token',value:`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,domain:'127.0.0.1',path:'/'}]);
}
test.beforeEach(async({page,request})=>{
 await request.post('http://127.0.0.1:4319/__fixture/reset');
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?route.continue():route.abort();});
});
test('public agenda, event detail and required login',async({page})=>{
 await page.goto('/espectaculos');await expect(page.getByRole('heading',{name:'Próximos eventos'})).toBeVisible();
 await page.getByRole('link').filter({hasText:'Concerto E2E local'}).first().click();
 await page.waitForURL(/\/espectaculos\/eventos\/1$/);
 await expect(page.getByRole('heading',{name:'Concerto E2E local',exact:true})).toBeVisible();await expect(page.getByText('Descrição do espetáculo local.')).toBeVisible();
 await page.goto('/espectaculos/encomendas');await expect(page).toHaveURL(/\/login\?next=/);
});
test('authenticated reservation, checkout, confirmation and printable QR ticket on mobile',async({page,context})=>{
 await authenticate(context);await page.setViewportSize({width:390,height:844});
 await page.goto('/espectaculos/eventos/1');await page.getByRole('spinbutton',{name:'Quantidade de Geral'}).fill('1');await page.getByRole('button',{name:'Registar participação'}).click();
 await expect(page).toHaveURL(new RegExp(`/encomendas/${order}`));
 await page.goto(`/espectaculos/checkout/${order}`);await expect(page.getByRole('heading',{name:'Concluir compra'})).toBeVisible();await expect(page.getByText('Taxas adicionais ao comprador')).toBeVisible();
 await page.getByRole('link',{name:'Confirmar registo gratuito na encomenda'}).click();await page.getByRole('button',{name:'Confirmar bilhetes gratuitos'}).click();
 await page.getByRole('link',{name:/Ver bilhete/}).click();await expect(page.getByRole('img',{name:'QR de entrada do bilhete'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Imprimir / guardar como PDF'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 const response=await page.request.get(`/espectaculos/bilhetes/${ticket}`);
 // Página do bilhete nunca pode ser servida de cache partilhada nem "stale":
 // `next build`+`start` emite `private, no-cache, no-store, …`; o `next dev`
 // usado nesta bateria força `no-cache, must-revalidate` (base-server.js) —
 // ambos impedem o armazenamento/reutilização do QR.
 expect(response.headers()['cache-control']).toMatch(/no-store|no-cache/);
 expect(response.headers()['cache-control']).toMatch(/no-store|must-revalidate/);
 const body=await response.text();
 expect(body).not.toContain('token_hash');expect(body).not.toContain('otj1_');
});
test('organization permissions and operational aggregates',async({page,context,request})=>{
 await authenticate(context,staff);await page.goto('/espectaculos/organizador/eventos/1');await page.getByRole('link',{name:'Estado operacional'}).click();
 await expect(page.getByRole('heading',{name:/Estado operacional/})).toBeVisible();await expect(page.getByText('Notificações adiadas')).toBeVisible();
 await request.post('http://127.0.0.1:4319/__fixture/state',{data:{role:'manager'}});
 await page.goto('/espectaculos/organizador/eventos/1');await expect(page.getByRole('link',{name:'Estado operacional'})).toHaveCount(0);await expect(page.getByText(/Receita bruta/)).toHaveCount(0);
 await page.goto('/espectaculos/organizador/eventos/1/operacao');await expect(page.getByRole('heading',{name:'Não foi possível concluir a operação'})).toBeVisible();
});
test('scanner reads actual ticket QR, suppresses rapid duplicates and recovers after camera denial',async({page,context,request})=>{
 await authenticate(context);await request.post('http://127.0.0.1:4319/__fixture/state',{data:{paid:true,status:'paid'}});
 await page.goto(`/espectaculos/bilhetes/${ticket}`);
 const src=await page.getByRole('img',{name:'QR de entrada do bilhete'}).getAttribute('src');
 await page.addScriptTag({path:path.resolve('node_modules/jsqr/dist/jsQR.js')});
 const token=await page.evaluate(async(src)=>{
  const img=new Image();img.src=src!;await img.decode();const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);const pixels=ctx.getImageData(0,0,img.width,img.height);
  return (window as unknown as {jsQR:(data:Uint8ClampedArray,w:number,h:number)=>{data:string}}).jsQR(pixels.data,img.width,img.height).data;
 },src);
 await authenticate(context,staff);await page.goto('/espectaculos/organizador/eventos/1/sessoes/1/checkin');
 await page.getByRole('button',{name:'Ler QR com a câmara'}).click();await expect(page.getByRole('status')).toContainText('Não foi possível abrir a câmara');
 await page.getByRole('textbox',{name:'Código lido pelo leitor QR'}).fill(token);await page.getByRole('button',{name:'Validar',exact:true}).click();await expect(page.getByRole('status')).toContainText('Entrada aceite');
 await page.getByRole('textbox').fill(token);await page.getByRole('button',{name:'Validar',exact:true}).click();await expect(page.getByRole('status')).toContainText('Leitura repetida');
 await page.getByRole('button',{name:'Reiniciar leitor'}).click();await expect(page.getByRole('status')).toContainText('Pronto para nova leitura');
 expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
});
test('scanner reports every operational refusal without buyer details',async({page,context,request})=>{
 await authenticate(context,staff);await page.goto('/espectaculos/organizador/eventos/1/sessoes/1/checkin');
 for(const [result,label] of Object.entries({already_used:'já utilizado',wrong_session:'sessão errados',cancelled:'cancelado',refunded:'reembolsado',refund_pending:'Reembolso pendente',review:'Bilhete suspenso',invalid:'Bilhete inválido'})){
  await request.post('http://127.0.0.1:4319/__fixture/state',{data:{checkinResult:result}});
  await page.getByRole('textbox').fill('otj1_'+result.padEnd(43,'A'));await page.getByRole('button',{name:'Validar',exact:true}).click();await expect(page.getByRole('status')).toContainText(label);
 }
});
