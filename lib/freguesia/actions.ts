'use server';

import { createClient } from '@/lib/supabase/server';

export interface EntidadeComCategoria {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  categoria_id: number;
  telefone?: string;
  email?: string;
  website?: string;
  estado: string;
  created_at?: string;
  categorias_entidade?: {
    nome: string;
    icone?: string;
  };
}

export async function getFreguesiaByCodigo(codigo: string) {
  const supabase = createClient();

  const { data: freguesia, error } = await supabase
    .from('freguesias')
    .select('*')
    .eq('cod_ine', codigo)
    .single();

  if (error || !freguesia) {
    return null;
  }

  return freguesia;
}

export async function getEntidadesByFreguesia(
  frequesiaId: number
): Promise<EntidadeComCategoria[]> {
  const supabase = createClient();

  const { data: entidades, error } = await supabase
    .from('entidades')
    .select(`
      id,
      nome,
      slug,
      descricao,
      categoria_id,
      telefone,
      email,
      website,
      estado,
      created_at,
      categorias_entidade(nome, icone)
    `)
    .eq('freguesia_id', frequesiaId)
    .eq('estado', 'publicado')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar entidades:', error);
    return [];
  }

  return (entidades || []).map((entidade) => {
    const categoriaRaw = entidade.categorias_entidade as unknown;
    const categoria = Array.isArray(categoriaRaw)
      ? categoriaRaw[0]
      : categoriaRaw;

    return {
      ...entidade,
      categorias_entidade: categoria as EntidadeComCategoria['categorias_entidade'],
    };
  });
}

export async function getEntidadeBySlug(slug: string) {
  const supabase = createClient();

  const { data: entidade, error } = await supabase
    .from('entidades')
    .select(`
      *,
      categorias_entidade(nome, descricao, icone),
      horarios(*),
      horarios_excecoes(*),
      eventos(*)
    `)
    .eq('slug', slug)
    .eq('estado', 'publicado')
    .single();

  if (error || !entidade) {
    return null;
  }

  return entidade;
}

export async function getCategorias() {
  const supabase = createClient();

  const { data: categorias, error } = await supabase
    .from('categorias_entidade')
    .select('id, nome, icone')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }

  return categorias || [];
}
