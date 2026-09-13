import { createClient } from '@/lib/supabase/server';
import { IMAGEM_MAX_FICHEIROS, validarImagem, extensaoParaImagem } from '@/lib/uploads/validar-imagem';

export type LupSaveResult = { error: string } | { id: number };

/** Called only by the LUP server actions; the database also enforces ownership. */
async function saveLupAdRequest(formData: FormData, adId?: number): Promise<LupSaveResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado' };
  const text = (name: string) => String(formData.get(name) ?? '').trim();
  const requestId = text('request_id');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
    return { error: 'Pedido inválido. Recarregue a página e tente novamente.' };
  }
  const type = text('type');
  const categoryId = Number(text('categoryId'));
  if (!['oferta', 'venda', 'procura'].includes(type) || !text('title') || !text('description') ||
      !text('location') || !Number.isSafeInteger(categoryId) || categoryId <= 0 ||
      !['message', 'phone', 'email'].includes(text('contactMethod'))) {
    return { error: 'Preencha os campos obrigatórios do anúncio.' };
  }
  const price = type === 'venda' ? Number(text('price')) : null;
  if (type === 'venda' && (!text('price') || !Number.isFinite(price) || price! < 0)) {
    return { error: 'Preço inválido.' };
  }
  const details: Record<string, string> = {};
  if (type !== 'procura') {
    if (!Number.isFinite(Number(text('quantity'))) || Number(text('quantity')) <= 0 || !text('unit') ||
        !Number.isFinite(Date.parse(text('pickupEndsAt')))) {
      return { error: 'Quantidade, unidade e prazo de recolha são obrigatórios.' };
    }
    if (text('pickupStartsAt') && (!Number.isFinite(Date.parse(text('pickupStartsAt'))) ||
        Date.parse(text('pickupStartsAt')) > Date.parse(text('pickupEndsAt')))) {
      return { error: 'Janela de recolha inválida.' };
    }
    details.quantity = text('quantity');
    details.unit = text('unit');
    details.pickup_ends_at = text('pickupEndsAt');
    if (text('pickupStartsAt')) details.pickup_starts_at = text('pickupStartsAt');
    if (text('kgEstimate')) details.kg_estimate = text('kgEstimate');
  }
  const count = Number(text('image_count'));
  if (!Number.isInteger(count) || count < 0 || count > IMAGEM_MAX_FICHEIROS) return { error: 'Número de imagens inválido.' };
  const files: File[] = [];
  for (let i = 0; i < count; i++) {
    const file = formData.get(`image_${i}`);
    if (!(file instanceof File)) return { error: `Imagem ${i + 1}: ficheiro inválido.` };
    const error = await validarImagem(file);
    if (error) return { error: `Imagem ${i + 1}: ${error}` };
    files.push(file);
  }
  // Validate every image before creating/updating a row: a rejected image must not create an ad.
  const { data, error } = await supabase.rpc('lup_ad_guardar', {
    p_data: { title: text('title'), description: text('description'), type, category_id: categoryId,
      location: text('location'), contact_method: text('contactMethod'), price, details },
    p_request_id: requestId, p_ad_id: adId ?? null,
  });
  if (error || !data?.[0]?.ad_id) return { error: 'Não foi possível guardar o anúncio. Tente novamente.' };
  const saved = data[0] as { ad_id: number; created: boolean };
  // A replay returns the existing ad and does not upload/attach the images twice.
  if (saved.created || adId !== undefined) {
    for (const [i, file] of files.entries()) {
      const fileName = `${saved.ad_id}/${crypto.randomUUID()}.${extensaoParaImagem(file.type)}`;
      const { error: uploadError } = await supabase.storage.from('marketplace-photos').upload(fileName, file);
      if (uploadError) { console.error('LUP: falha no upload da imagem', uploadError.name); continue; }
      const { data: url } = supabase.storage.from('marketplace-photos').getPublicUrl(fileName);
      const { error: photoError } = await supabase.from('marketplace_photos').insert({
        ad_id: saved.ad_id, storage_path: url.publicUrl, sort_order: i,
      });
      if (photoError) console.error('LUP: falha ao associar imagem', photoError.code);
    }
  }
  return { id: saved.ad_id };
}

// Redirects are performed by the page after this function returns, never caught here.
export async function saveLupAd(formData: FormData, adId?: number): Promise<LupSaveResult> {
  try {
    return await saveLupAdRequest(formData, adId);
  } catch {
    return { error: 'Não foi possível guardar o anúncio. Tente novamente.' };
  }
}
