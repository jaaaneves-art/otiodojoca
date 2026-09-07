import 'server-only';
export type OperationRecord = { operation: 'maintenance' | 'notification' | 'payment' | 'refund' | 'webhook'; outcome: 'success' | 'failed' | 'deferred' | 'busy' | 'lease_lost'; requestId: string; entityId?: string; durationMs: number; retryCount?: number };
/** Build an allowlisted record; never serialize errors, request bodies or arbitrary metadata. */
export function operationRecord(input: OperationRecord) {
 const id = (value: string | undefined) => value && /^[a-f0-9-]{36}$/i.test(value) ? value : undefined;
 return { module: 'espectaculos', operation: ['maintenance','notification','payment','refund','webhook'].includes(input.operation) ? input.operation : 'maintenance',
 outcome: ['success','failed','deferred','busy','lease_lost'].includes(input.outcome) ? input.outcome : 'failed', requestId: id(input.requestId), entityId: id(input.entityId),
 durationMs: Number.isFinite(input.durationMs) ? Math.max(0, Math.round(input.durationMs)) : 0, retryCount: Number.isFinite(input.retryCount) ? Math.max(0, Math.min(1000, Math.floor(input.retryCount!))) : undefined };
}
export function logOperation(input: OperationRecord) { console.info(JSON.stringify(operationRecord(input))); }
