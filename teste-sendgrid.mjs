import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
const env = Object.fromEntries(
  readFileSync('.env.local','utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => {
      const i = l.indexOf('=');
      const key = l.slice(0, i).trim();
      let val = l.slice(i + 1).trim();
      val = val.replace(/\r$/, '');               // linha com terminador Windows (\r\n)
      val = val.replace(/^["']|["']$/g, '');       // valor entre aspas no .env.local
      return [key, val];
    })
);

console.log('Diagnóstico (sem expor o valor todo):');
console.log('- SENDGRID_API_KEY encontrada:', env.SENDGRID_API_KEY ? 'sim' : 'NÃO');
console.log('- comprimento:', env.SENDGRID_API_KEY?.length ?? 0);
console.log('- começa por "SG.":', env.SENDGRID_API_KEY?.startsWith('SG.') ?? false);
console.log('- primeiros 5 chars:', JSON.stringify(env.SENDGRID_API_KEY?.slice(0, 5)));
console.log('- últimos 3 chars (raw, para apanhar \\r ou aspas):', JSON.stringify(env.SENDGRID_API_KEY?.slice(-3)));
console.log('');

sgMail.setApiKey(env.SENDGRID_API_KEY);
try {
  const [r] = await sgMail.send({
    to: process.argv[2],
    from: env.SENDGRID_FROM_EMAIL || 'noreply@superloja.com',
    subject: 'Teste SendGrid — OTJ',
    text: 'Se recebeste isto, o envio funciona.',
  });
  console.log('✅ Aceite:', r.statusCode);
} catch (e) {
  console.error('❌', e.code, JSON.stringify(e.response?.body?.errors ?? e.message));
}
