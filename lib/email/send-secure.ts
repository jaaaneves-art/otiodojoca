'use server';
import 'server-only';

import sgMail from '@sendgrid/mail';
import { logEmailEvent } from '@/lib/audit/log';

/**
 * Envio de email transacional via SendGrid (API direta, `@sendgrid/mail`).
 *
 * Distinto do envio de email do Supabase Auth (confirmação de registo,
 * recuperação de password, etc.), que passa pelo SMTP relay do SendGrid
 * configurado no Supabase Dashboard (Authentication → SMTP Settings) —
 * esse caminho já funciona e não passa por este ficheiro. Este ficheiro
 * é para email que a própria aplicação decide enviar (ex.: convite de
 * tutor no Escutismo, notificações), que até 07/09/2026 não existia:
 * a biblioteca estava instalada e a SENDGRID_API_KEY no .env.local, mas
 * nenhuma linha de código chamava a API.
 *
 * IMPORTANTE — 07/09/2026: a SENDGRID_API_KEY atual no .env.local está
 * confirmada como inválida/revogada para a API Web (erro 401 "invalid,
 * expired, or revoked"), apesar de o SMTP relay do Supabase continuar a
 * funcionar com outra chave. Este ficheiro não vai funcionar em runtime
 * até isso ficar resolvido — ver
 * docs/pendentes/SENDGRID-PAUSADO-DOMINIO-DEFINITIVO-20260907.md.
 * O código em si está pronto; falta só a chave.
 */

let apiKeyConfigurada = false;

function garantirApiKey() {
  if (apiKeyConfigurada) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY não está definida em .env.local');
  }
  sgMail.setApiKey(apiKey);
  apiKeyConfigurada = true;
}

export interface EnviarEmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  templateUsed?: string;      // nome livre, só para o registo de auditoria
  userId?: string;            // dono do email, se aplicável (para email_audit_logs.user_id)
}

export interface ResultadoEnvio {
  sucesso: boolean;
  erro?: string;
}

/**
 * Envia um email e regista sempre o resultado em `email_audit_logs`
 * (sucesso ou falha) — nunca lança: quem chama decide o que fazer com
 * `sucesso: false`, mas uma falha de email não deve rebentar o fluxo
 * que a originou (ex.: um convite de tutor falhado não deve impedir o
 * registo em si de terminar).
 */
export async function enviarEmailSeguro(payload: EnviarEmailPayload): Promise<ResultadoEnvio> {
  try {
    garantirApiKey();

    const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@superloja.com';

    if (!payload.text && !payload.html) {
      return { sucesso: false, erro: 'É preciso indicar text ou html.' };
    }

    // @sendgrid/mail exige, no tipo, que pelo menos um de text/html seja
    // uma string definida (não ambos opcionais) — daqui os dois ramos.
    const base = { to: payload.to, from, subject: payload.subject };
    const mensagem = payload.html
      ? { ...base, html: payload.html, ...(payload.text ? { text: payload.text } : {}) }
      : { ...base, text: payload.text ?? '' };

    await sgMail.send(mensagem);

    await logEmailEvent({
      recipientEmail: payload.to,
      subject: payload.subject,
      userId: payload.userId,
      templateUsed: payload.templateUsed,
      success: true,
    });

    return { sucesso: true };
  } catch (error: any) {
    const mensagemErro =
      error?.response?.body?.errors?.[0]?.message ?? error?.message ?? 'Erro desconhecido';

    await logEmailEvent({
      recipientEmail: payload.to,
      subject: payload.subject,
      userId: payload.userId,
      templateUsed: payload.templateUsed,
      success: false,
      errorMessage: mensagemErro,
    });

    return { sucesso: false, erro: mensagemErro };
  }
}
