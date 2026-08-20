"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { infoLua } from "@/lib/calendario/lua";
import type { EstadoPlantacao, TipoEvento, CriarPlantacaoInput, AtualizarPlantacaoInput, AdicionarEventoInput } from "./tipos";

export interface ResultadoAcao {
  sucesso: boolean;
  erro?: string;
}

export interface ResultadoCriarPlantacao extends ResultadoAcao {
  plantacaoId?: number;
}

async function utilizadorAutenticado() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/**
 * Criar plantação
 * CORRIGIDO: cultura_id é string (UUID), não number
 */
export async function criarPlantacao(formData: FormData): Promise<ResultadoCriarPlantacao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  // CORRIGIDO: cultura_id é string UUID, não number
  const culturaId = formData.get("cultura_id") as string; // ← MUDANÇA
  const dataPlantacaoTexto = formData.get("data_plantacao") as string;
  const localNome = (formData.get("local_nome") as string) || null;
  const notas = (formData.get("notas") as string) || null;

  if (!culturaId || !dataPlantacaoTexto) {
    return { sucesso: false, erro: "Cultura e data de plantação são obrigatórias." };
  }

  // Validar que cultura_id é uuid válido (simples check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(culturaId)) {
    return { sucesso: false, erro: "Cultura inválida." };
  }

  const { data: cultura, error: erroCultura } = await supabase
    .from("culturas_guia")
    .select("ciclo_dias_min, ciclo_dias_max")
    .eq("id", culturaId)
    .single();

  if (erroCultura || !cultura) {
    return { sucesso: false, erro: "Cultura não encontrada." };
  }

  // Validar data
  const dataPlantacao = new Date(`${dataPlantacaoTexto}T12:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  if (dataPlantacao < hoje) {
    return { sucesso: false, erro: "Data de plantação não pode ser no passado." };
  }

  const dataMax = new Date(hoje.getTime() + 90 * 24 * 60 * 60 * 1000);
  if (dataPlantacao > dataMax) {
    return { sucesso: false, erro: "Data de plantação não pode ser mais de 90 dias no futuro." };
  }

  const faseLunarPlantacao = infoLua(dataPlantacao).nome;

  // Ciclo pode não existir na fonte (perenes, ou culturas ainda sem dado estruturado)
  // Só calcula a previsão se houver ambos.
  let dataColheitaPrevista: string | null = null;
  if (cultura.ciclo_dias_min != null && cultura.ciclo_dias_max != null) {
    const mediaDias = Math.round((cultura.ciclo_dias_min + cultura.ciclo_dias_max) / 2);
    const prevista = new Date(dataPlantacao.getTime() + mediaDias * 86400000);
    dataColheitaPrevista = prevista.toISOString().slice(0, 10);
  }

  // CORRIGIDO: estado inicial é "planejado" (não "plantada")
  const { data: plantacao, error } = await supabase
    .from("plantacoes")
    .insert({
      utilizador_id: user.id,
      cultura_id: culturaId, // ← UUID string
      local_nome: localNome,
      data_plantacao: dataPlantacaoTexto,
      data_colheita_prevista: dataColheitaPrevista,
      estado: "planejado", // ← CORRIGIDO (era "plantada")
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

/**
 * Atualizar estado de plantação
 * CORRIGIDO: EstadoPlantacao tem valores correctos
 */
export async function atualizarEstadoPlantacao(
  plantacaoId: number,
  novoEstado: EstadoPlantacao,
): Promise<ResultadoAcao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  // Validar que novoEstado é um dos valores permitidos
  const estadosValidos: EstadoPlantacao[] = [
    "planejado",
    "em_crescimento",
    "em_producao",
    "colhido",
    "interrompido",
  ];
  
  if (!estadosValidos.includes(novoEstado)) {
    return { sucesso: false, erro: `Estado inválido: ${novoEstado}` };
  }

  const { data: atual, error: erroAtual } = await supabase
    .from("plantacoes")
    .select("estado, utilizador_id")
    .eq("id", plantacaoId)
    .single();

  if (erroAtual || !atual || atual.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Plantação não encontrada." };
  }

  const { error: erroUpdate } = await supabase
    .from("plantacoes")
    .update({ estado: novoEstado })
    .eq("id", plantacaoId);

  if (erroUpdate) {
    return { sucesso: false, erro: "Não foi possível atualizar a plantação." };
  }

  // Registar evento no histórico
  await adicionarEvento({
    plantacao_id: plantacaoId,
    evento: "observacao", // ou "estado_alterado" se existir no DB
    valor_antigo: atual.estado,
    valor_novo: novoEstado,
    notas_utilizador: `Estado alterado de ${atual.estado} para ${novoEstado}`,
  });

  revalidatePath("/agenda-agricola");
  return { sucesso: true };
}

/**
 * Adicionar evento ao histórico
 * CORRIGIDO: TipoEvento tem valores correctos
 */
export async function adicionarEvento(
  input: AdicionarEventoInput,
): Promise<ResultadoAcao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  // Validar que evento é um dos valores permitidos
  const eventosValidos: TipoEvento[] = [
    "plantacao",
    "adubacao",
    "rega",
    "poda",
    "colheita",
    "problema",
    "observacao",
    "fenologia",
  ];
  
  if (!eventosValidos.includes(input.evento)) {
    return { sucesso: false, erro: `Evento inválido: ${input.evento}` };
  }

  // Verificar ownership
  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("utilizador_id")
    .eq("id", input.plantacao_id)
    .single();

  if (!plantacao || plantacao.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Sem permissão." };
  }

  const { error } = await supabase
    .from("plantacao_historico")
    .insert({
      plantacao_id: input.plantacao_id,
      evento: input.evento,
      valor_antigo: input.valor_antigo || null,
      valor_novo: input.valor_novo || null,
      notas_utilizador: input.notas_utilizador || null,
    });

  if (error) {
    return { sucesso: false, erro: "Não foi possível adicionar evento." };
  }

  revalidatePath("/agenda-agricola");
  return { sucesso: true };
}

/**
 * Listar plantações do utilizador
 */
export async function listarPlantacoes(filtroEstado?: EstadoPlantacao) {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado.", dados: [] };
  const { supabase, user } = auth;

  let query = supabase
    .from("plantacoes")
    .select(
      `
      *,
      cultura:cultura_id(
        id, nome, categoria, ciclo_dias_min, ciclo_dias_max
      )
    `
    )
    .eq("utilizador_id", user.id)
    .order("data_plantacao", { ascending: false });

  if (filtroEstado) {
    query = query.eq("estado", filtroEstado);
  }

  const { data, error } = await query;

  if (error) {
    return { sucesso: false, erro: error.message, dados: [] };
  }

  return { sucesso: true, dados: data || [] };
}

/**
 * Obter plantação por ID
 */
export async function obterPlantacao(id: number) {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("plantacoes")
    .select(
      `
      *,
      cultura:cultura_id(
        id, nome, nome_cientifico, categoria, ciclo_dias_min, ciclo_dias_max,
        meses_semeadura, meses_colheita, descricao, dicas
      )
    `
    )
    .eq("id", id)
    .eq("utilizador_id", user.id)
    .single();

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true, dados: data };
}

/**
 * Adicionar nota a uma plantação
 * Regista um evento "observacao" no histórico com o texto do utilizador.
 */
export async function adicionarNota(
  plantacaoId: number,
  formData: FormData,
): Promise<ResultadoAcao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const texto = (formData.get("texto") as string)?.trim();
  if (!texto) {
    return { sucesso: false, erro: "A nota não pode estar vazia." };
  }

  // Verificar ownership
  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("utilizador_id")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Sem permissão." };
  }

  const { error } = await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "observacao",
    notas_utilizador: texto,
  });

  if (error) {
    return { sucesso: false, erro: "Não foi possível adicionar a nota." };
  }

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  return { sucesso: true };
}

/**
 * Adicionar foto a uma plantação
 * Acrescenta uma entrada ao array JSONB "fotografias" da plantação
 * e regista um evento "observacao" no histórico.
 */
export async function adicionarFoto(
  plantacaoId: number,
  formData: FormData,
): Promise<ResultadoAcao> {
  const auth = await utilizadorAutenticado();
  if (!auth) return { sucesso: false, erro: "Não autenticado." };
  const { supabase, user } = auth;

  const url = (formData.get("url") as string)?.trim();
  if (!url) {
    return { sucesso: false, erro: "O link da foto não pode estar vazio." };
  }

  // Validação simples de URL
  try {
    new URL(url);
  } catch {
    return { sucesso: false, erro: "Link inválido." };
  }

  // Verificar ownership e ler fotografias atuais
  const { data: plantacao } = await supabase
    .from("plantacoes")
    .select("utilizador_id, fotografias")
    .eq("id", plantacaoId)
    .single();

  if (!plantacao || plantacao.utilizador_id !== user.id) {
    return { sucesso: false, erro: "Sem permissão." };
  }

  const novaFoto = {
    id: crypto.randomUUID(),
    url,
    path: "", // vazio: por agora é link externo, não upload para Storage
    criada_em: new Date().toISOString(),
  };

  const fotografiasAtuais = Array.isArray(plantacao.fotografias)
    ? plantacao.fotografias
    : [];
  const fotografiasNovas = [...fotografiasAtuais, novaFoto];

  const { error: erroUpdate } = await supabase
    .from("plantacoes")
    .update({ fotografias: fotografiasNovas })
    .eq("id", plantacaoId);

  if (erroUpdate) {
    return { sucesso: false, erro: "Não foi possível guardar a foto." };
  }

  // Registar no histórico (não bloqueia se falhar)
  await supabase.from("plantacao_historico").insert({
    plantacao_id: plantacaoId,
    evento: "observacao",
    notas_utilizador: "Foto adicionada.",
  });

  revalidatePath(`/agenda-agricola/plantacao/${plantacaoId}`);
  return { sucesso: true };
}
