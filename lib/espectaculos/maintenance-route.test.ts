import { beforeEach,expect,it,vi } from 'vitest';
const run=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/espectaculos/reconciliation',()=>({maintainTicketing:run}));
import { POST } from '@/app/api/espectaculos/maintenance/route';
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('ESPECTACULOS_MAINTENANCE_SECRET','local-fixture-only');});
it('rejects missing authorization without doing work',async()=>{const r=await POST(new Request('http://localhost/api/espectaculos/maintenance',{method:'POST'}));expect(r.status).toBe(401);expect(r.headers.get('cache-control')).toBe('no-store');expect(run).not.toHaveBeenCalled();});
it('does not trust query string secrets',async()=>{const r=await POST(new Request('http://localhost/api/espectaculos/maintenance?secret=local-fixture-only',{method:'POST'}));expect(r.status).toBe(401);});
it('returns metrics without caching',async()=>{run.mockResolvedValue({busy:false,notifications:{deferred:2}});const r=await POST(new Request('http://localhost/api/espectaculos/maintenance',{method:'POST',headers:{authorization:'Bearer local-fixture-only'}}));expect(r.status).toBe(200);expect(r.headers.get('cache-control')).toBe('no-store');});
it('sanitizes server failures',async()=>{run.mockRejectedValue(new Error('private payload'));const r=await POST(new Request('http://localhost/api/espectaculos/maintenance',{method:'POST',headers:{authorization:'Bearer local-fixture-only'}}));expect(r.status).toBe(503);expect(await r.text()).not.toContain('private');});
