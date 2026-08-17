"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { infoLua } from "@/lib/calendario/lua";
import type { EstadoPlantacao } from "./tipos";

async function utilizadorAutenticado() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, user };
}

export async function criarPlantacao(formData: FormData) {
  const { supabase, user } = await utilizadorAutenticado();

  const culturaId = Number(formData.get("cultura_id"));
  const dataPlantacaoTexto = formData.get("data_plantacao") as string;
  const localNome = (formData.get("local_nome") as string) || null;
  const notas = (formData.get("notas") as string) || null;

  if (!culturaId || !dataPlantacaoTexto) {
    throw new Error("Cultura e data de plantação são obrigatórias.");
  }

  const { data: cultura, error: erroCultura } = await supabase
    .from("culturas_guia")
    .select("ciclo_dias_min, ciclo_dias_max")
    .eq("id", culturaId)
    .single();

  if (erroCultura || !cultura) {
    throw new Error("Cultura não encontrada.");
  }

  const dataPlantacao = new Date(`${dataPlantacaoTexto}T12:00:00`);
  const faseLunarPlantacao = infoLua(dataPlantacao).nome;

  let dataColheitaPrevista: string | null = null;
  if (cultura.ciclo_dias_min != null && cultura.ciclo_dias_max != null) {
    const mediaDias = Math.round((cultura.ciclo_dias_min + cultura.ciclo_dias_max) / 2);
    const prevista = new Date(dataPlantacao.getTime() + mediaDias * 86400000);
    dataColheitaPrevista = prevista.toISOString().slice(0, 10);
  }

  const { data: plantacao, error } = await supabase
    .from("plantacoes")
    .insert({
      user_id: user.id,
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
    throw new Error("Não foi possível criar a plantação: " + error?.message);
  }

  revalidatePath("/agenda-agricola");
  redirect(`/agenda-agricola/plantacao/${plantacao.id}`);
}

export async function atualizarEstadoPlantacao(
  plantacaoId: number,
  novoEstado: EstadoPlantacao,
) {
  const { supabase, user } = await utilizadorAutenticado();

  const { data: atual, error: erroAtual } = await supabase
    .from("plantacoes")
    .select("estado, user_id")
    .eq("id", plantacaoId)
    .single();

  if (erroAtual || !atual || atual.user_id !== user.id) {
    throw new Error("Plantação não encontrada.");
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

  if (error) throw new Error("Não foi possível atualizar o estado: " + error.message);

  await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: novoEstado === "colhida" ? "colhida" : "estado_alterado",
    valor_antigo: atual.estado,
    valor_novo: novoEstado,
  });

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  revalidatePath("/agenda-agricola");
}

export async function adicionarNota(plantacaoId: number, formData: FormData) {
  const texto = (formData.get("texto") as string) ?? "";
  if (!texto.trim()) return;
  const { supabase, user } = await utilizadorAutenticado();

  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("user_id")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.user_id !== user.id) {
    throw new Error("Plantação não encontrada.");
  }

  const { error } = await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "nota_adicionada",
    notas_utilizador: texto.trim(),
  });

  if (error) throw new Error("Não foi possível adicionar a nota: " + error.message);

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
}

export async function adicionarFoto(plantacaoId: number, formData: FormData) {
  const url = (formData.get("url") as string) ?? "";
  if (!url.trim()) return;
  const { supabase, user } = await utilizadorAutenticado();

  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("user_id, fotografias")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.user_id !== user.id) {
    throw new Error("Plantação não encontrada.");
  }

  const fotografias = [...(plantacao.fotografias ?? []), url.trim()];

  const { error } = await supabase
    .from("plantacoes")
    .update({ fotografias, updated_at: new Date().toISOString() })
    .eq("id", plantacaoId);

  if (error) throw new Error("Não foi possível adicionar a foto: " + error.message);

  await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "foto_adicionada",
    valor_novo: url.trim(),
  });

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
}
