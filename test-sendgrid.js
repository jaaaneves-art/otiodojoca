
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'seu_email@gmail.com', // MUDAR PARA SEU EMAIL
  from: 'test@example.com', // pode ser qualquer coisa agora
  subject: 'Teste SendGrid - O Tio do Joca',
  html: '<h1>Email de Teste!</h1><p>SendGrid está funcionando ✅</p>',
};

sgMail
  .send(msg)
  .then(() => console.log('✅ Email enviado com sucesso!'))
  .catch(error => console.error('❌ Erro:', error.message));
