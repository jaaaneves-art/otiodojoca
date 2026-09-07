'use server';
import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Auditoria — escreve na tabela `audit_log` (singular) que já existe.
 *
 * O pacote original (05/09) escrevia em `audit_logs` (plural), que não
 * existe. Duas tabelas cujo nome difere numa letra acabam sempre com os
 * logs repartidos entre as duas, por isso usa-se a existente.
 *
 * Colunas reais: id, user_id, action, success (boolean), ip (inet),
 * user_agent, details (jsonb), created_at, resource_type, resource_id
 * (as duas últimas acrescentadas por supabase/migrations/20260906140000_sprint10_seguranca.sql).
 *
 * Não há `status` de três valores nem `old_values`/`new_values`
 * separados — o antes/depois vai dentro de `details`.
 *
 * A escrita é feita por service role de propósito: a policy de INSERT
 * antiga (`WITH CHECK true`, qualquer autenticado) foi removida pela
 * mesma migration — um log que o utilizador possa escrever não é um log.
 */
export interface LogAuditPayload {
  action: string;                          // 'LOGIN', 'UPDATE_AD', ...
  userId?: string;
  resourceType?: string;                   // 'user', 'marketplace_ad', ...
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  extra?: Record<string, unknown>;
}

/**
 * Regista um evento. Nunca lança: uma falha de auditoria não deve
 * bloquear a ação que a originou.
 */
export async function logAuditEvent(payload: LogAuditPayload): Promise<void> {
  try {
    const details: Record<string, unknown> = { ...(payload.extra ?? {}) };
    if (payload.oldValues)    details.old_values = payload.oldValues;
    if (payload.newValues)    details.new_values = payload.newValues;
    if (payload.errorMessage) details.error_message = payload.errorMessage;

    const { error } = await createAdminClient().from('audit_log').insert({
      action: payload.action,
      user_id: payload.userId ?? null,
      resource_type: payload.resourceType ?? null,
      resource_id: payload.resourceId ?? null,
      success: payload.success ?? true,
      // inet: null em vez de '0.0.0.0', que seria um IP falso no registo
      ip: payload.ip ?? null,
      user_agent: payload.userAgent ?? null,
      details,
    });

    if (error) console.warn('[AUDIT_LOG_ERROR]', error.message);
  } catch (error) {
    console.warn('[AUDIT_LOG_ERROR]', error);
  }
}

export async function logSuccess(
  action: string,
  userId?: string,
  resourceType?: string,
  resourceId?: string,
  newValues?: Record<string, unknown>,
): Promise<void> {
  return logAuditEvent({ action, userId, resourceType, resourceId, newValues, success: true });
}

export async function logFailure(
  action: string,
  errorMessage: string,
  userId?: string,
  resourceType?: string,
  resourceId?: string,
): Promise<void> {
  return logAuditEvent({ action, userId, resourceType, resourceId, errorMessage, success: false });
}

/**
 * Auditoria de email. Tabela nova (email_audit_logs), com as mesmas
 * convenções de nomes da audit_log: success/ip/details, não
 * status/ip_address/old_values.
 */
export interface LogEmailPayload {
  recipientEmail: string;
  subject: string;
  userId?: string;
  templateUsed?: string;
  success?: boolean;
  errorMessage?: string;
  ip?: string;
  extra?: Record<string, unknown>;
}

export async function logEmailEvent(payload: LogEmailPayload): Promise<void> {
  try {
    const { error } = await createAdminClient().from('email_audit_logs').insert({
      user_id: payload.userId ?? null,
      recipient_email: payload.recipientEmail,
      subject: payload.subject,
      template_used: payload.templateUsed ?? null,
      success: payload.success ?? true,
      error_message: payload.errorMessage ?? null,
      ip: payload.ip ?? null,
      details: payload.extra ?? {},
    });

    if (error) console.warn('[EMAIL_AUDIT_ERROR]', error.message);
  } catch (error) {
    console.warn('[EMAIL_AUDIT_ERROR]', error);
  }
}

/**
 * Verificação de email. Lê auth.users.email_confirmed_at através da
 * função SQL email_verificado() — não há coluna espelhada em profiles,
 * de propósito: seria mais um campo a divergir da fonte.
 */
export async function emailVerificado(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc('email_verificado', { p_user_id: userId });
  if (error) {
    console.warn('[EMAIL_VERIFICADO_ERROR]', error.message);
    return false;
  }
  return data === true;
}
