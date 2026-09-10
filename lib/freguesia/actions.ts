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
  const supabase = await createClient();

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

export interface FreguesiaResumo {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
}

export async function getFreguesias(): Promise<FreguesiaResumo[]> {
  const supabase = await createClient();

  const { data: freguesias, error } = await supabase
    .from('freguesias')
    .select('id, cod_ine, nome, municipio')
    .eq('active', true)
    .order('municipio', { ascending: true })
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar freguesias:', error);
    return [];
  }

  return freguesias || [];
}

export async function getEntidadesByFreguesia(
  frequesiaId: number
): Promise<EntidadeComCategoria[]> {
  const supabase = await createClient();

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
  const supabase = await createClient();

  const { data: entidade, error } = await supabase
    .from('entidades')
    .select(`
      *,
      categorias_entidade(nome, descricao, icone),
      horarios(*),
      horarios_excecoes(*),
      eventos(*),
      freguesias(cod_ine, nome)
    `)
    .eq('slug', slug)
    .eq('estado', 'publicado')
    .single();

  if (error || !entidade) {
    return null;
  }

  // Tal como em getEntidadesByFreguesia, as relações 1:1 embutidas podem
  // vir como array de um elemento consoante a forma como o PostgREST
  // resolve a FK — normalizar aqui para não obrigar as páginas a lidar
  // com as duas formas.
  const paraObjeto = <T,>(valor: T | T[] | null | undefined): T | null => {
    if (Array.isArray(valor)) return valor[0] ?? null;
    return valor ?? null;
  };

  return {
    ...entidade,
    categorias_entidade: paraObjeto(entidade.categorias_entidade),
    freguesias: paraObjeto(entidade.freguesias),
  };
}

export async function getCategorias() {
  const supabase = await createClient();

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
