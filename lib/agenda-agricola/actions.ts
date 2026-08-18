"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { infoLua } from "@/lib/calendario/lua";
import type { EstadoPlantacao } from "./tipos";

export interface ResultadoAcao {
  sucesso: boolean;
  erro?: string;
}

export interface ResultadoCriarPlantacao extends ResultadoAcao {
  plantacaoId?: number;
}

async function utilizadorAutenticado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function criarPlantacao(formData: FormData): Promise<ResultadoCriarPlantacao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const culturaId = Number(formData.get("cultura_id"));
  const dataPlantacaoTexto = formData.get("data_plantacao") as string;
  const localNome = (formData.get("local_nome") as string) || null;
  const notas = (formData.get("notas") as string) || null;

  if (!culturaId || !dataPlantacaoTexto) {
    return { sucesso: false, erro: "Cultura e data de plantação são obrigatórias." };
  }

  const { data: cultura, error: erroCultura } = await supabase
    .from("culturas_guia")
    .select("ciclo_dias_min, ciclo_dias_max")
    .eq("id", culturaId)
    .single();

  if (erroCultura || !cultura) {
    return { sucesso: false, erro: "Cultura não encontrada." };
  }

  const dataPlantacao = new Date(`${dataPlantacaoTexto}T12:00:00`);
  const faseLunarPlantacao = infoLua(dataPlantacao).nome;

  // Ciclo pode não existir na fonte (perenes, ou culturas ainda sem dado
  // estruturado no Volume_IV) -- só calcula a previsão se houver ambos.
  let dataColheitaPrevista: string | null = null;
  if (cultura.ciclo_dias_min != null && cultura.ciclo_dias_max != null) {
    const mediaDias = Math.round((cultura.ciclo_dias_min + cultura.ciclo_dias_max) / 2);
    const prevista = new Date(dataPlantacao.getTime() + mediaDias * 86400000);
    dataColheitaPrevista = prevista.toISOString().slice(0, 10);
  }

  const { data: plantacao, error } = await supabase
    .from("plantacoes")
    .insert({
      utilizador_id: user.id,
      cultura_id: culturaId,
      local_nome: localNome,
      data_plantacao: dataPlantacaoTexto,
      data_colheita_prevista: dataColheitaPrevista,
      fase_lunar_plantacao: faseLunarPlantacao,
      notas,
    })
    .select("id")
    .single();

  if (error || !plantacao) {
    return { sucesso: false, erro: "Não foi possível criar a plantação: " + error?.message };
  }

  revalidatePath("/agenda-agricola");
  return { sucesso: true, plantacaoId: plantacao.id };
}

export async function atualizarEstadoPlantacao(
  plantacaoId: number,
  novoEstado: EstadoPlantacao,
): Promise<ResultadoAcao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const { data: atual, error: erroAtual } = await supabase
    .from("plantacoes")
    .select("estado, utilizador_id")
    .eq("id", plantacaoId)
    .single();

  if (erroAtual || !atual || atual.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Plantação não encontrada." };
  }

  const atualizacao: Record<string, unknown> = {
    estado: novoEstado,
    updated_at: new Date().toISOString(),
  };
  if (novoEstado === "colhida") {
    atualizacao.data_colheita_real = new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase
    .from("plantacoes")
    .update(atualizacao)
    .eq("id", plantacaoId);

  if (error) return { sucesso: false, erro: "Não foi possível atualizar o estado: " + error.message };

  await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: novoEstado === "colhida" ? "colhida" : "estado_alterado",
    valor_antigo: atual.estado,
    valor_novo: novoEstado,
  });

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  revalidatePath("/agenda-agricola");
  return { sucesso: true };
}

export async function adicionarNota(plantacaoId: number, formData: FormData): Promise<ResultadoAcao> {
  const texto = ((formData.get("texto") as string) ?? "").trim();
  if (!texto) return { sucesso: false, erro: "Escreve uma nota antes de submeter." };

  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("utilizador_id")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Plantação não encontrada." };
  }

  const { error } = await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "nota_adicionada",
    notas_utilizador: texto,
  });

  if (error) return { sucesso: false, erro: "Não foi possível adicionar a nota: " + error.message };

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  return { sucesso: true };
}

export async function adicionarFoto(plantacaoId: number, formData: FormData): Promise<ResultadoAcao> {
  const url = ((formData.get("url") as string) ?? "").trim();
  if (!url) return { sucesso: false, erro: "Cola um link antes de submeter." };

  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("utilizador_id, fotografias")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Plantação não encontrada." };
  }

  const fotografias = [...(plantacao.fotografias ?? []), url];

  const { error } = await supabase
    .from("plantacoes")
    .update({ fotografias, updated_at: new Date().toISOString() })
    .eq("id", plantacaoId);

  if (error) return { sucesso: false, erro: "Não foi possível adicionar a foto: " + error.message };

  await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "foto_adicionada",
    valor_novo: url,
  });

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  return { sucesso: true };
}
