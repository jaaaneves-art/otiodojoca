// lib/marketplace/mediacao-actions.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { MediacaoFormSchema, MediacaoFormData, CATEGORIA_NOMES, CATEGORIA_SLUGS } from './mediacao-tipos';

async function resolverCategoriaId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .eq('type', 'marketplace')
    .single();
  if (error || !data) {
    console.error(`[mediacao] Categoria "${slug}" não encontrada — corre a migration mediacao-migration.sql`, error);
    return null;
  }
  return data.id;
}

async function uploadFotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fotos: File[],
  adId: number
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < fotos.length; i++) {
    const file = fotos[i];
    const filePath = `${adId}/${adId}-${i}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { error: uploadError } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) {
      console.error('[mediacao] Erro no upload do ficheiro:', uploadError);
      continue;
    }
    const { data } = supabase.storage.from('marketplace-images').getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }
  return urls;
}

async function gravarFotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adId: number,
  urls: string[],
  sortOrderInicial = 0
) {
  if (urls.length === 0) return;
  const registos = urls.map((storage_path, idx) => ({ ad_id: adId, storage_path, sort_order: sortOrderInicial + idx }));
  const { error } = await supabase.from('marketplace_photos').insert(registos);
  if (error) console.error('[mediacao] Erro ao gravar fotos:', error);
}

function buildDetails(validado: MediacaoFormData) {
  return {
    tipo: 'mediacao',
    categoria_mediacao: validado.categoria,
    cae: validado.cae || undefined,
    telefone: validado.telefone,
    email: validado.email,
    endereco: validado.endereco,
    horarios: validado.horarios,
    profissionais: validado.profissionais,
    especialidades: validado.especialidades,
    parceiros: validado.parceiros,
    certificacoes: validado.certificacoes,
    aceita_consulta_online: validado.aceita_consulta_online,
    link_agendamento: validado.link_agendamento || undefined,
    taxa_media_cobrada: validado.taxa_media_cobrada,
  };
}

export async function criarMediacao(data: MediacaoFormData, userId: string) {
  try {
    const validado = MediacaoFormSchema.parse(data);
    const supabase = await createClient();
    const categoryId = await resolverCategoriaId(supabase, CATEGORIA_SLUGS[validado.categoria]);

    const { data: ad, error: adError } = await supabase
      .from('marketplace_ads')
      .insert({
        author_id: userId,
        title: validado.nome,
        description: validado.descricao,
        category_id: categoryId,
        price: null,
        price_type: null,
        location: validado.endereco,
        contact_method: null,
        type: 'servico',
        status: 'active',
        details: buildDetails(validado),
      })
      .select()
      .single();

    if (adError) throw adError;

    if (validado.fotos && validado.fotos.length > 0) {
      const urls = await uploadFotos(supabase, validado.fotos, ad.id);
      await gravarFotos(supabase, ad.id, urls);
    }

    revalidatePath('/mediacao');
    revalidatePath(`/mediacao/${validado.categoria}`);

    return { sucesso: true, id: ad.id, mensagem: `${CATEGORIA_NOMES[validado.categoria]} criado com sucesso!` };
  } catch (erro) {
    console.error('Erro ao criar mediação:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function atualizarMediacao(adId: number, data: MediacaoFormData, userId: string) {
  try {
    const validado = MediacaoFormSchema.parse(data);
    const supabase = await createClient();
    const categoryId = await resolverCategoriaId(supabase, CATEGORIA_SLUGS[validado.categoria]);

    const { data: atualizado, error: updateError } = await supabase
      .from('marketplace_ads')
      .update({
        title: validado.nome,
        description: validado.descricao,
        category_id: categoryId,
        location: validado.endereco,
        details: buildDetails(validado),
      })
      .eq('id', adId)
      .eq('author_id', userId)
      .select()
      .single();

    if (updateError || !atualizado) {
      return { sucesso: false, erro: 'Não foi possível atualizar (ou não tens permissão para editar este perfil)' };
    }

    if (validado.fotos && validado.fotos.length > 0) {
      const { count } = await supabase
        .from('marketplace_photos')
        .select('*', { count: 'exact', head: true })
        .eq('ad_id', adId);
      const urls = await uploadFotos(supabase, validado.fotos, adId);
      await gravarFotos(supabase, adId, urls, count || 0);
    }

    revalidatePath('/mediacao');
    revalidatePath(`/mediacao/${validado.categoria}`);
    revalidatePath(`/mediacao/${validado.categoria}/${adId}`);

    return { sucesso: true, id: adId, mensagem: 'Perfil atualizado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao atualizar mediação:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function apagarMediacao(adId: number, userId: string) {
  try {
    const supabase = await createClient();

    const { data: fotos } = await supabase.from('marketplace_photos').select('storage_path').eq('ad_id', adId);
    if (fotos && fotos.length > 0) {
      const caminhos = fotos
        .map((f) => {
          const match = f.storage_path.match(/marketplace-images\/(.+)$/);
          return match ? match[1] : null;
        })
        .filter((c): c is string => Boolean(c));
      if (caminhos.length > 0) {
        await supabase.storage.from('marketplace-images').remove(caminhos);
      }
    }

    const { error: deleteError } = await supabase.from('marketplace_ads').delete().eq('id', adId).eq('author_id', userId);
    if (deleteError) throw deleteError;

    revalidatePath('/mediacao');
    return { sucesso: true, mensagem: 'Perfil apagado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao apagar mediação:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}
