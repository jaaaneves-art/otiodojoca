// lib/marketplace/favoritos-actions.ts
//
// Fusão de app/gran-bazar/favoritos/actions.ts e
// app/mercado-da-terra/favoritos/actions.ts — os dois eram idênticos byte a
// byte na lógica, só diferiam nos caminhos de revalidatePath. Ver
// docs/pendentes/RELATORIO-BACKEND-API-BLOCO6-20260823.md, secção 10
// (Duplicação-01, 🔵 FUNDIR).
//
// Cada módulo mantém o seu próprio app/<modulo>/favoritos/actions.ts como
// wrapper fino (só chama esta função com o `module` fixo) — nenhum import
// existente nos componentes muda. Sem "use server" aqui de propósito: este
// ficheiro nunca é importado por um componente cliente nem passado
// directamente como `action` de um `<form>` — só pelos wrappers "use server"
// de cada módulo, por isso não precisa (nem deve) ser uma Server Action à
// parte.

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Alterna o estado de favorito de um anúncio. Se já estiver nos favoritos,
 * remove; senão, adiciona.
 *
 * @param module slug do módulo (ex: "gran-bazar", "mercado-da-terra") —
 *   usado só para saber que páginas revalidar (`/${module}`,
 *   `/${module}/${adId}`, `/${module}/favoritos`), nunca para filtrar a
 *   escrita — marketplace_favorites já é genérica (ligada só por ad_id).
 */
export async function toggleFavoritoAction(module: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Utilizador nao autenticado');
  }

  const adId = parseInt(formData.get('adId') as string);
  if (!adId) {
    throw new Error('Anuncio invalido');
  }

  const { data: existing } = await supabase
    .from('marketplace_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('ad_id', adId)
    .maybeSingle();

  if (existing) {
    await supabase.from('marketplace_favorites').delete().eq('id', existing.id);
  } else {
    await supabase.from('marketplace_favorites').insert({ user_id: user.id, ad_id: adId });
  }

  revalidatePath(`/${module}`);
  revalidatePath(`/${module}/${adId}`);
  revalidatePath(`/${module}/favoritos`);
}
