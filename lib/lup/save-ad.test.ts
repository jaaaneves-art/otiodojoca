import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  auth: vi.fn(), rpc: vi.fn(), upload: vi.fn(), photo: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({
  auth: { getUser: mock.auth }, rpc: mock.rpc,
  from: (table: string) => {
    if (table !== 'marketplace_photos') throw new Error(`Unexpected direct write: ${table}`);
    return { insert: mock.photo };
  },
  storage: { from: () => ({ upload: mock.upload, getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.test/${path}` } }) }) },
}) }));
import { saveLupAd } from './save-ad';

function form(type = 'oferta') {
  const data = new FormData();
  Object.entries({ request_id: '11111111-1111-4111-8111-111111111111', type,
    title: 'Excedentes', description: 'Descrição', categoryId: '1', location: 'Braga',
    contactMethod: 'phone', price: '3.50', quantity: '2', unit: 'kg',
    pickupEndsAt: '2027-01-01T12:00:00.000Z', image_count: '0',
  }).forEach(([k, v]) => data.set(k, v));
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mock.auth.mockResolvedValue({ data: { user: { id: 'owner' } } });
  mock.rpc.mockResolvedValue({ data: [{ ad_id: 42, created: true }], error: null });
  mock.upload.mockResolvedValue({ error: null });
  mock.photo.mockResolvedValue({ error: null });
});
describe('LUP server action boundary', () => {
  it.each(['oferta', 'venda', 'procura'])('sends all fields for %s through RPC only', async type => {
    expect(await saveLupAd(form(type))).toEqual({ id: 42 });
    expect(mock.rpc).toHaveBeenCalledWith('lup_ad_guardar', expect.objectContaining({
      p_request_id: '11111111-1111-4111-8111-111111111111', p_ad_id: null,
      p_data: expect.objectContaining({ type, title: 'Excedentes', category_id: 1,
        price: type === 'venda' ? 3.5 : null, contact_method: 'phone', location: 'Braga',
        details: type === 'procura' ? {} : { quantity: '2', unit: 'kg', pickup_ends_at: '2027-01-01T12:00:00.000Z' },
      }),
    }));
  });
  it('requires a session before writing', async () => {
    mock.auth.mockResolvedValue({ data: { user: null } });
    expect(await saveLupAd(form())).toEqual({ error: 'Não autenticado' });
    expect(mock.rpc).not.toHaveBeenCalled();
  });
  it.each([['request_id', 'bad'], ['price', 'NaN'], ['categoryId', '2wrong'],
    ['quantity', '0'], ['contactMethod', 'other'], ['pickupEndsAt', 'bad'], ['image_count', '6']])(
    'rejects invalid %s before RPC', async (key, value) => {
      const data = form('venda'); data.set(key, value);
      expect(await saveLupAd(data)).toHaveProperty('error');
      expect(mock.rpc).not.toHaveBeenCalled();
    });
  it('validates actual image bytes before creating the ad', async () => {
    const data = form(); data.set('image_count', '1');
    data.set('image_0', new File(['not png'], 'a.png', { type: 'image/png' }));
    expect(await saveLupAd(data)).toHaveProperty('error');
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.upload).not.toHaveBeenCalled();
  });
  it('attaches validated images to the returned ad, not an input id', async () => {
    const data = form(); data.set('image_count', '1');
    data.set('image_0', new File([new Uint8Array([137,80,78,71,13,10,26,10])], 'a.png', { type: 'image/png' }));
    expect(await saveLupAd(data)).toEqual({ id: 42 });
    expect(mock.upload).toHaveBeenCalledOnce();
    expect(mock.photo).toHaveBeenCalledWith(expect.objectContaining({ ad_id: 42, sort_order: 0 }));
  });
  it('a replay reuses the ad and does not attach the images twice', async () => {
    const data = form(); data.set('image_count', '1');
    data.set('image_0', new File([new Uint8Array([255,216,255])], 'a.jpg', { type: 'image/jpeg' }));
    mock.rpc.mockResolvedValue({ data: [{ ad_id: 42, created: false }], error: null });
    expect(await saveLupAd(data)).toEqual({ id: 42 });
    expect(mock.upload).not.toHaveBeenCalled();
  });
  it('passes the edit id to the database ownership/module check', async () => {
    await saveLupAd(form('procura'), 71);
    expect(mock.rpc.mock.calls[0][1].p_ad_id).toBe(71);
  });
  it('returns a retryable error on an unexpected network failure', async () => {
    mock.rpc.mockRejectedValue(new Error('network failure'));
    expect(await saveLupAd(form())).toHaveProperty('error');
    expect(mock.upload).not.toHaveBeenCalled();
  });
  it('does not upload or return success when RPC fails', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { code: '42501' } });
    expect(await saveLupAd(form())).toHaveProperty('error');
    expect(mock.upload).not.toHaveBeenCalled();
  });
});
