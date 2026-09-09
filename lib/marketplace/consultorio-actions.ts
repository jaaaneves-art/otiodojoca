// lib/marketplace/consultorio-actions.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ConsultorioFormSchema, ConsultorioFormData, CONSULTORIO_CATEGORIA_SLUG } from './consultorio-types';

async function resolverCategoriaId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', CONSULTORIO_CATEGORIA_SLUG)
    .eq('type', 'marketplace')
    .single();
  if (error || !data) {
    console.error('[consultorio] Categoria "consultorio-medico" não encontrada — corre a migration consultorio-migration.sql', error);
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
      console.error('[consultorio] Erro no upload da foto:', uploadError);
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
  if (error) console.error('[consultorio] Erro ao gravar fotos:', error);
}

function buildDetails(validado: ConsultorioFormData) {
  return {
    tipo: 'consultorio',
    cae: validado.cae || undefined,
    especialidades: validado.especialidades,
    telefone: validado.telefone,
    email: validado.email,
    endereco: validado.endereco,
    horarios: validado.horarios,
    profissionais: validado.profissionais,
    aceita_seguros: validado.aceita_seguros,
    preco_consulta: validado.preco_consulta,
  };
}

export async function criarConsultorio(data: ConsultorioFormData, userId: string) {
  try {
    const validado = ConsultorioFormSchema.parse(data);
    const supabase = await createClient();
    const categoryId = await resolverCategoriaId(supabase);

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

    revalidatePath('/consultorios');

    return { sucesso: true, id: ad.id, mensagem: 'Consultório criado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao criar consultório:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function atualizarConsultorio(adId: number, data: ConsultorioFormData, userId: string) {
  try {
    const validado = ConsultorioFormSchema.parse(data);
    const supabase = await createClient();

    const { data: atualizado, error: updateError } = await supabase
      .from('marketplace_ads')
      .update({
        title: validado.nome,
        description: validado.descricao,
        location: validado.endereco,
        details: buildDetails(validado),
      })
      .eq('id', adId)
      .eq('author_id', userId)
      .select()
      .single();

    if (updateError || !atualizado) {
      return { sucesso: false, erro: 'Não foi possível atualizar (ou não tens permissão para editar este consultório)' };
    }

    if (validado.fotos && validado.fotos.length > 0) {
      const { count } = await supabase
        .from('marketplace_photos')
        .select('*', { count: 'exact', head: true })
        .eq('ad_id', adId);
      const urls = await uploadFotos(supabase, validado.fotos, adId);
      await gravarFotos(supabase, adId, urls, count || 0);
    }

    revalidatePath('/consultorios');
    revalidatePath(`/consultorios/${adId}`);

    return { sucesso: true, id: adId, mensagem: 'Consultório atualizado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao atualizar consultório:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function apagarConsultorio(adId: number, userId: string) {
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

    revalidatePath('/consultorios');
    return { sucesso: true, mensagem: 'Consultório apagado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao apagar consultório:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}
