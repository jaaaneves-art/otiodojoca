import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only',()=>({}));
vi.mock('./operation-log',()=>({logOperation:vi.fn()}));
import { processNotifications, type OutboxStore, type OutboxClaim } from './notification-worker';
import { notificationTemplate } from './notification-templates';
import { testNotificationTransport } from './notifications';
const id='11111111-1111-4111-8111-111111111111';
const item:OutboxClaim={id,order_id:id,kind:'order_confirmation',deduplication_key:'unique',lease_token:id,attempts:1};
function store():OutboxStore {return {claim:vi.fn().mockResolvedValueOnce(item).mockResolvedValue(null),renew:vi.fn().mockResolvedValue(true),recipient:vi.fn().mockResolvedValue({userId:id,email:'local@example.invalid',eventName:'Evento'}),finish:vi.fn().mockResolvedValue(true)};}
describe('notification worker',()=>{
 it('no-op defers without even resolving personal data',async()=>{const s=store();expect(await processNotifications({store:s})).toMatchObject({deferred:1,delivered:0});expect(s.recipient).not.toHaveBeenCalled();expect(s.finish).toHaveBeenCalledWith(item,'deferred','transport_unavailable',5);});
 it('deduplicates test delivery across retries',async()=>{const {transport,delivered}=testNotificationTransport();await processNotifications({store:store(),transport,origin:'http://127.0.0.1:4318'});await processNotifications({store:store(),transport,origin:'http://127.0.0.1:4318'});expect(delivered.size).toBe(1);});
 it('does not deliver after losing lease',async()=>{const s=store();vi.mocked(s.renew).mockResolvedValue(false);const {transport,delivered}=testNotificationTransport();expect(await processNotifications({store:s,transport})).toMatchObject({leaseLost:1});expect(delivered.size).toBe(0);expect(s.finish).not.toHaveBeenCalled();});
 it('sanitizes a transport exception',async()=>{const s=store();await processNotifications({store:s,origin:'http://localhost:4318',transport:{mode:'test',deliver:async()=>{throw new Error('client_secret PRIVATE EMAIL');}}});expect(s.finish).toHaveBeenCalledWith(item,'failed','delivery_failed',5);});
 it('does not claim after budget',async()=>{const s=store();await processNotifications({store:s,deadline:0});expect(s.claim).not.toHaveBeenCalled();});
 it('unconfirmed/missing recipient cannot deliver',async()=>{const s=store();vi.mocked(s.recipient).mockResolvedValue(null);const {transport,delivered}=testNotificationTransport();await processNotifications({store:s,transport});expect(delivered.size).toBe(0);expect(s.finish).toHaveBeenCalledWith(item,'failed','recipient_unavailable',5);});
 it('rejects invalid maximum attempts',async()=>{await expect(processNotifications({store:store(),maxAttempts:0})).rejects.toThrow();});
});
describe('safe templates',()=>{
 it.each(['order_confirmation','payment_confirmed','tickets_issued','cancellation','refund'] as const)('escapes %s template and keeps internal link',kind=>{const t=notificationTemplate(kind,id,'<img src=x onerror=alert(1)>','https://example.invalid');expect(t.html).not.toContain('<img');expect(t.html).toContain('&lt;img');expect(t.html).toContain(`/espectaculos/encomendas/${id}`);});
 it('pending is explicitly not paid',()=>expect(notificationTemplate('order_confirmation',id,'Evento','http://localhost:4318').text).toContain('Ainda não confirma pagamento'));
 it.each(['javascript:alert(1)','https://user:pass@example.invalid','https://example.invalid/?redirect=x'])('rejects unsafe origin',origin=>expect(()=>notificationTemplate('refund',id,'Evento',origin)).toThrow());
});
