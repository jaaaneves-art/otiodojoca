"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function criarAlerta(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autenticado");
  }

  const nome = ((formData.get("nome") as string) || "").trim();
  const termo = ((formData.get("termo") as string) || "").trim() || null;
  const municipioIdRaw = formData.get("municipio_id") as string;
  const modalidade = ((formData.get("modalidade") as string) || "").trim() || null;

  if (!nome) {
    throw new Error("Dá um nome ao alerta, para o reconheceres na tua lista.");
  }

  const { error } = await supabase.from("job_alerts").insert({
    candidate_id: user.id,
    nome,
    termo,
    municipio_id: municipioIdRaw ? Number(municipioIdRaw) : null,
    modalidade,
  });

  if (error) {
    throw new Error("Não foi possível criar o alerta. " + error.message);
  }

  redirect("/empregos/alertas");
}

// Mesma disciplina defensiva do resto do módulo (ver vagas/actions.ts):
// a RLS ("Candidato gere os seus alertas", auth.uid() = candidate_id) é
// quem decide de facto se a escrita passa -- o .select().single() a
// seguir transforma um bloqueio silencioso num erro explícito.
async function definirEstadoAlerta(alertId: number, ativo: boolean) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_alerts")
    .update({ ativo })
    .eq("id", alertId)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      "Não foi possível atualizar o alerta -- confirma que ainda é teu. " + (error?.message ?? "")
    );
  }

  revalidatePath("/empregos/alertas");
}

export async function pausarAlerta(alertId: number) {
  await definirEstadoAlerta(alertId, false);
}

export async function reativarAlerta(alertId: number) {
  await definirEstadoAlerta(alertId, true);
}

export async function removerAlerta(alertId: number) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_alerts")
    .delete()
    .eq("id", alertId)
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(
      "Não foi possível remover o alerta -- confirma que ainda é teu. " + (error?.message ?? "")
    );
  }

  revalidatePath("/empregos/alertas");
}
