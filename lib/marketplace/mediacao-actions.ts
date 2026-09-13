// lib/marketplace/mediacao-actions.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
'use server';

import { createClient } from '@/lib/supabase/server';
import { extensaoParaImagem, validarImagem } from '@/lib/uploads/validar-imagem';
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

    const erro = await validarImagem(file);
    if (erro) {
      console.error(`[mediacao] Imagem ${i + 1} rejeitada:`, erro);
      continue;
    }

    // Nome sempre gerado pelo servidor -- file.name nunca entra no
    // caminho gravado no Storage (só o tipo real, já confirmado acima).
    const filePath = `${adId}/${adId}-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extensaoParaImagem(file.type)}`;
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

export async function criarMediacao(data: MediacaoFormData) {
  try {
    const validado = MediacaoFormSchema.parse(data);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { sucesso: false, erro: 'É preciso iniciar sessão.' };
    }

    const categoryId = await resolverCategoriaId(supabase, CATEGORIA_SLUGS[validado.categoria]);

    // CORRIGIDO 13/09/2026 — deixou de fazer INSERT direto em
    // marketplace_ads (bloqueado por RLS desde 20260913020000) e passou a
    // chamar a RPC marketplace_ad_criar(). p_location foi acrescentado à
    // RPC em 20260913132355 porque este formulário sempre preencheu esse
    // campo. price/price_type/contact_method continuam sempre null aqui,
    // por isso não fazem falta na RPC.
    const { data: adId, error: adError } = await supabase.rpc('marketplace_ad_criar', {
      p_title: validado.nome,
      p_description: validado.descricao,
      p_type: 'servico',
      p_details: buildDetails(validado),
      p_location: validado.endereco,
      p_category_id: categoryId,
    });

    if (adError) throw adError;

    if (validado.fotos && validado.fotos.length > 0) {
      const urls = await uploadFotos(supabase, validado.fotos, adId);
      await gravarFotos(supabase, adId, urls);
    }

    revalidatePath('/mediacao');
    revalidatePath(`/mediacao/${validado.categoria}`);

    return { sucesso: true, id: adId, mensagem: `${CATEGORIA_NOMES[validado.categoria]} criado com sucesso!` };
  } catch (erro) {
    console.error('Erro ao criar mediação:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function atualizarMediacao(adId: number, data: MediacaoFormData) {
  try {
    const validado = MediacaoFormSchema.parse(data);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { sucesso: false, erro: 'É preciso iniciar sessão.' };
    }

    const categoryId = await resolverCategoriaId(supabase, CATEGORIA_SLUGS[validado.categoria]);

    // CORRIGIDO 13/09/2026 — deixou de fazer UPDATE direto em
    // marketplace_ads (a policy antiga que permitia isto foi apagada,
    // ver 20260913160000/20260913170000) e passou a chamar a RPC
    // marketplace_ad_editar(), alargada nesse mesmo dia para aceitar
    // category_id/location/details.
    const { data: sucessoUpdate, error: updateError } = await supabase.rpc('marketplace_ad_editar', {
      p_ad_id: adId,
      p_title: validado.nome,
      p_description: validado.descricao,
      p_category_id: categoryId,
      p_location: validado.endereco,
      p_details: buildDetails(validado),
    });

    if (updateError || !sucessoUpdate) {
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

export async function apagarMediacao(adId: number) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { sucesso: false, erro: 'É preciso iniciar sessão.' };
    }

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

    // CORRIGIDO 13/09/2026 — deixou de fazer DELETE direto em
    // marketplace_ads, passou a chamar marketplace_ad_apagar().
    const { data: sucessoDelete, error: deleteError } = await supabase.rpc('marketplace_ad_apagar', {
      p_ad_id: adId,
    });
    if (deleteError) throw deleteError;
    if (!sucessoDelete) {
      return { sucesso: false, erro: 'Não foi possível apagar (ou não tens permissão para este perfil)' };
    }

    revalidatePath('/mediacao');
    return { sucesso: true, mensagem: 'Perfil apagado com sucesso!' };
  } catch (erro) {
    console.error('Erro ao apagar mediação:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}
