import { expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { operationRecord } from './operation-log';
it('allowlists fields and rejects secrets disguised as IDs',()=>{
 const record=operationRecord({operation:'notification',outcome:'failed',requestId:'client_secret',entityId:'buyer@example.invalid',durationMs:NaN,retryCount:Infinity,...{error:'secret',payload:'private'}});
 expect(JSON.stringify(record)).not.toMatch(/secret|private|buyer|error/);expect(record.durationMs).toBe(0);
});
