import { createClient } from "@/lib/supabase/server";

export type CulturaAptidao = {
  id: string;
  aptidao: string;
  peso_importancia: number;
  descricao: string | null;
};

export type CulturaProduto = {
  id: string;
  produto_nome: string;
  parte_usada?: string;
  peso_importancia: number;
  descricao: string | null;
};

export type Cultura = {
  id: string;
  nome: string;
  descricao_cientifico?: string;
  categoria: string;
  tipo_cultura: string;
  subcategoria?: string;
  descricao_estendida?: string;
  aptidoes: CulturaAptidao[];
  produtos: CulturaProduto[];
};

const CULTURA_SELECT =
  "id, nome, descricao_cientifico:nome_cientifico, categoria, tipo_cultura, subcategoria, descricao_estendida, " +
  "aptidoes:culturas_aptidoes(id, aptidao, peso_importancia, descricao), " +
  "produtos:culturas_produtos(id, produto_nome, parte_usada:parte_planta, peso_importancia, descricao)";

function normalizarCultura(row: any): Cultura {
  return {
    ...row,
    descricao_cientifico: row.descricao_cientifico ?? undefined,
    subcategoria: row.subcategoria ?? undefined,
    descricao_estendida: row.descricao_estendida ?? undefined,
    tipo_cultura: row.tipo_cultura ?? "Anual",
    aptidoes: row.aptidoes ?? [],
    produtos: (row.produtos ?? []).map((p: any) => ({
      ...p,
      parte_usada: p.parte_usada ?? undefined,
    })),
  };
}

export async function listarCulturas(): Promise<Cultura[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("culturas_guia")
    .select(CULTURA_SELECT)
    .order("nome");

  if (error) throw error;
  return (data ?? []).map(normalizarCultura);
}

export async function listarCategorias(): Promise<Array<{ id: number; name: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("culturas_guia")
    .select("categoria")
    .order("categoria");

  if (error) throw error;
  const distintas = Array.from(new Set((data ?? []).map((r) => r.categoria)));
  return distintas.map((name, id) => ({ id, name }));
}

export async function obterCultura(id: string): Promise<{
  cultura: Cultura;
  culturasSimilares: Array<{ id: string; nome: string; categoria: string; tipo_cultura: string }>;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("culturas_guia")
    .select(CULTURA_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const cultura = normalizarCultura(data);

  const { data: similares } = await supabase
    .from("culturas_guia")
    .select("id, nome, categoria, tipo_cultura")
    .eq("categoria", cultura.categoria)
    .neq("id", id)
    .limit(4);

  return { cultura, culturasSimilares: similares ?? [] };
}

export function calcularEstatisticas(culturas: Cultura[]) {
  const totalCulturas = culturas.length;
  const totalAptidoes = culturas.reduce((acc, c) => acc + c.aptidoes.length, 0);
  const totalProdutos = culturas.reduce((acc, c) => acc + c.produtos.length, 0);

  const culturasPorTipo: Record<string, number> = {};
  for (const c of culturas) {
    culturasPorTipo[c.tipo_cultura] = (culturasPorTipo[c.tipo_cultura] ?? 0) + 1;
  }

  const aptidoesDistintas = new Set(culturas.flatMap((c) => c.aptidoes.map((a) => a.aptidao))).size;
  const produtosDistintos = new Set(culturas.flatMap((c) => c.produtos.map((p) => p.produto_nome))).size;

  const distribuicao = Object.entries(culturasPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade }));

  const aptidoesMap = new Map<string, { quantidade: number; culturas: Set<string> }>();
  for (const c of culturas) {
    for (const a of c.aptidoes) {
      const entry = aptidoesMap.get(a.aptidao) ?? { quantidade: 0, culturas: new Set<string>() };
      entry.quantidade += 1;
      entry.culturas.add(c.id);
      aptidoesMap.set(a.aptidao, entry);
    }
  }
  const aptidoes = Array.from(aptidoesMap.entries()).map(([aptidao, v]) => ({
    aptidao,
    quantidade: v.quantidade,
    culturas: v.culturas.size,
  }));

  const produtosMap = new Map<string, { quantidade: number; culturas: Set<string> }>();
  for (const c of culturas) {
    for (const p of c.produtos) {
      const entry = produtosMap.get(p.produto_nome) ?? { quantidade: 0, culturas: new Set<string>() };
      entry.quantidade += 1;
      entry.culturas.add(c.id);
      produtosMap.set(p.produto_nome, entry);
    }
  }
  const produtos = Array.from(produtosMap.entries()).map(([produto, v]) => ({
    produto,
    quantidade: v.quantidade,
    culturas: v.culturas.size,
  }));

  return {
    stats: {
      totalCulturas,
      totalAptidoes,
      totalProdutos,
      tiposDistintos: Object.keys(culturasPorTipo).length,
      culturasPorTipo,
      aptidoesDistintas,
      produtosDistintos,
    },
    charts: { distribuicao, aptidoes, produtos },
  };
}
