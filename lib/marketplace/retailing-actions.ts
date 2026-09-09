// lib/marketplace/retailing-actions.ts
//
// CORRIGIDO 08/09/2026 — reescrito para o schema real do marketplace
// (marketplace_ads.author_id/title/description/category_id/details,
// categories em vez de marketplace_categories, bucket
// marketplace-images, marketplace_photos.ad_id/storage_path/sort_order).
// Ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md.
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  RetailingFormSchema,
  RetailingFormData,
  CATEGORIA_NOMES,
  CATEGORIA_SLUGS,
} from './retailing-tipos';

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
    console.error(`[retailing] Categoria "${slug}" não encontrada — corre a migration retailing-migration.sql`, error);
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
    const fileName = `${adId}-${i}-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `${adId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('marketplace-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('[retailing] Erro no upload da foto:', uploadError);
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
  const registos = urls.map((storage_path, idx) => ({
    ad_id: adId,
    storage_path,
    sort_order: sortOrderInicial + idx,
  }));
  const { error } = await supabase.from('marketplace_photos').insert(registos);
  if (error) console.error('[retailing] Erro ao gravar fotos:', error);
}

function buildDetails(validado: RetailingFormData) {
  return {
    tipo: 'retailing',
    categoria_retailing: validado.categoria,
    cae: validado.cae || undefined,
    telefone: validado.telefone,
    email: validado.email,
    endereco: validado.endereco,
    area_metros_quadrados: validado.area_metros_quadrados,
    ano_abertura: validado.ano_abertura,
    departamentos: validado.departamentos,
    servicos_adicionais: validado.servicos_adicionais,
    programa_lealdade: validado.programa_lealdade,
    descricao_programa: validado.descricao_programa,
    horarios: validado.horarios,
    metodos_pagamento: validado.metodos_pagamento,
    aceita_multibanco: validado.aceita_multibanco,
    aceita_cartao: validado.aceita_cartao,
    aceita_mbway: validado.aceita_mbway,
    aceita_criptomoedas: validado.aceita_criptomoedas,
  };
}

export async function criarRetailing(data: RetailingFormData, userId: string) {
  try {
    const validado = RetailingFormSchema.parse(data);
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

    revalidatePath('/retailing');
    revalidatePath(`/retailing/${validado.categoria}`);

    return {
      sucesso: true,
      id: ad.id,
      mensagem: `${CATEGORIA_NOMES[validado.categoria]} criado com sucesso!`,
    };
  } catch (erro) {
    console.error('Erro ao criar retailing:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function atualizarRetailing(adId: number, data: RetailingFormData, userId: string) {
  try {
    const validado = RetailingFormSchema.parse(data);
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
      return { sucesso: false, erro: 'Não foi possível atualizar (ou não tens permissão para editar este estabelecimento)' };
    }

    if (validado.fotos && validado.fotos.length > 0) {
      const { count } = await supabase
        .from('marketplace_photos')
        .select('*', { count: 'exact', head: true })
        .eq('ad_id', adId);

      const urls = await uploadFotos(supabase, validado.fotos, adId);
      await gravarFotos(supabase, adId, urls, count || 0);
    }

    revalidatePath('/retailing');
    revalidatePath(`/retailing/${validado.categoria}`);
    revalidatePath(`/retailing/${validado.categoria}/${adId}`);

    return { sucesso: true, id: adId, mensagem: 'Estabelecimento atualizado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao atualizar retailing:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function apagarRetailing(adId: number, userId: string) {
  try {
    const supabase = await createClient();

    const { data: fotos } = await supabase
      .from('marketplace_photos')
      .select('storage_path')
      .eq('ad_id', adId);

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

    const { error: deleteError } = await supabase
      .from('marketplace_ads')
      .delete()
      .eq('id', adId)
      .eq('author_id', userId);

    if (deleteError) throw deleteError;

    revalidatePath('/retailing');

    return { sucesso: true, mensagem: 'Estabelecimento apagado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao apagar retailing:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}
