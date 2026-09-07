import 'server-only';
import { notificationOrigin, type NotificationKind } from './notification-templates';
export type { NotificationKind } from './notification-templates';
export type Notification = { id: string; kind: NotificationKind; orderId: string; userId: string; email: string; eventName: string };
export type Delivery = Notification & { deduplicationKey: string; subject: string; text: string; html: string };
export interface NotificationTransport {
 /** A future real adapter MUST deduplicate durably on deduplicationKey and honor AbortSignal.
  * A lease fences database writes, not an external provider's delivery after timeout. */
 readonly mode?: 'noop' | 'test';
 deliver(notification: Delivery, signal?: AbortSignal): Promise<'delivered' | 'deferred'>;
}
/** No provider import or network I/O. Deferred deliveries consume attempts and back off. */
export const deferredNotifications: NotificationTransport = { mode: 'noop', async deliver() { return 'deferred'; } };
/** Compatibility factory: real email delivery remains disabled in Phase 5. */
export function existingEmailTransport(origin: string): NotificationTransport {
 if (!origin.startsWith('https:')) throw new Error('Origem de email inválida.');
 notificationOrigin(origin); return deferredNotifications;
}
/** In-memory, deterministic double for tests only; never used by the maintenance endpoint. */
export function testNotificationTransport() {
 const delivered = new Map<string, Delivery>();
 const transport: NotificationTransport = { mode: 'test', async deliver(n, signal) {
  signal?.throwIfAborted(); if (!delivered.has(n.deduplicationKey)) delivered.set(n.deduplicationKey, n); return 'delivered';
 } };
 return { transport, delivered };
}
