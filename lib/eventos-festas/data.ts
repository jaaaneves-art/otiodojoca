import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { one, positiveInteger } from './validation';
import type { Catalogs, EmpresaGerida, EmpresaPublica, SearchParams } from './types';

export const getCatalogs = cache(async (): Promise<Catalogs | null> => {
  const db = await createClient();
  const results = await Promise.all([
    db.from('eventos_festas_categorias').select('slug,nome').eq('ativo', true).order('nome'),
    db.from('eventos_festas_servicos').select('slug,nome,nota,sinonimos').eq('ativo', true).order('nome'),
    db.from('eventos_festas_tipos').select('slug,nome,grupo_slug,sinonimos').eq('ativo', true).order('nome'),
    db.from('eventos_festas_servico_categorias').select('servico_slug,categoria_slug'),
  ]);
  if (results.some(r => r.error)) return null;
  return { categorias: results[0].data ?? [], servicos: results[1].data ?? [], tipos: results[2].data ?? [], relacoes: results[3].data ?? [] } as Catalogs;
});
export async function searchEmpresas(params: SearchParams): Promise<EmpresaPublica[] | null> {
  const db = await createClient();
  const { data, error } = await db.rpc('eventos_festas_pesquisar', {
    p_texto: one(params.q).slice(0, 200), p_servico: one(params.servico).slice(0, 150),
    p_tipo: one(params.tipo).slice(0, 150), p_categoria: one(params.categoria).slice(0, 150),
    p_local: one(params.local).slice(0, 200), p_pais: one(params.pais).slice(0, 2),
    p_capacidade: Math.min(positiveInteger(one(params.capacidade)) ?? 0, 1000000) || null,
    p_pagina: Math.min(positiveInteger(one(params.pagina)) ?? 1, 10000),
  });
  return error ? null : (data ?? []) as EmpresaPublica[];
}
export async function getEmpresa(slug: string) {
  const db = await createClient();
  const { data, error } = await db.from('eventos_festas_diretorio').select('slug,nome,descricao,fotografias,telefone,email,website,redes_sociais,pais_codigo,regiao,localidade,lugar,freguesia,concelho,distrito,verificada,capacidade,area_servico,servicos,tipos,categorias').eq('slug', slug).maybeSingle();
  return { empresa: data as EmpresaPublica | null, unavailable: Boolean(error) };
}
export async function getManaged(): Promise<EmpresaGerida[] | null> {
  const db = await createClient();
  const { data, error } = await db.rpc('eventos_festas_minhas_empresas');
  return error ? null : (data ?? []) as EmpresaGerida[];
}
