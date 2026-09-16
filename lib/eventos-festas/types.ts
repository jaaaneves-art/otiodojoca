export type CatalogItem = { slug: string; nome: string; nota?: string | null; sinonimos?: string[]; grupo_slug?: string | null };
export type Catalogs = {
  categorias: CatalogItem[]; servicos: CatalogItem[]; tipos: CatalogItem[];
  relacoes: { servico_slug: string; categoria_slug: string }[];
};
export type EmpresaPublica = {
  slug: string; nome: string; descricao: string | null; fotografias: string[] | null;
  telefone: string | null; email: string | null; website: string | null;
  redes_sociais: Record<string, string> | null; pais_codigo: string; regiao: string | null;
  localidade: string | null; lugar: string | null; freguesia: string | null;
  concelho: string | null; distrito: string | null; verificada: boolean;
  capacidade: number | null; area_servico: string | null;
  servicos: CatalogItem[]; tipos: CatalogItem[]; categorias: string[];
};
export type EmpresaGerida = Omit<EmpresaPublica, 'servicos' | 'tipos' | 'categorias' | 'freguesia' | 'concelho' | 'distrito'> & {
  id: number; freguesia_id: number | null; estado_entidade: string;
  estado: 'rascunho' | 'pendente' | 'ativo' | 'suspenso' | null;
  servicos: string[]; tipos: string[];
};
export type SearchParams = Record<string, string | string[] | undefined>;
