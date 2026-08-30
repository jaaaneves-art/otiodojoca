import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Endpoint chamado periodicamente (Vercel Cron ou equivalente -- ver
// vercel.json e a secção 15 de docs/EMPREGOS.md) para verificar todos
// os alertas de emprego ativos e criar notificações para vagas novas
// que correspondam aos critérios de cada um.
//
// Não corre em nome de nenhum utilizador (não há sessão aqui -- é um
// pedido do sistema, não de um browser), por isso usa sempre
// createAdminClient() (service role), tal como o resto do módulo faz
// para escrever notifications em nome de outra pessoa. Protegido por
// um cabeçalho Authorization com um segredo partilhado (CRON_SECRET),
// para que só a rotina agendada o consiga chamar.
//
// force-dynamic: este endpoint tem de correr sempre, nunca servir uma
// resposta em cache -- cada chamada tem de ver o estado atual da BD.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JobAlertRow = {
  id: number;
  candidate_id: string;
  nome: string;
  termo: string | null;
  municipio_id: number | null;
  modalidade: string | null;
  ultima_verificacao_em: string | null;
  created_at: string;
};

type JobRow = { id: number; titulo: string };

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: alertas, error: alertasError } = await admin
    .from("job_alerts")
    .select("id, candidate_id, nome, termo, municipio_id, modalidade, ultima_verificacao_em, created_at")
    .eq("ativo", true);

  if (alertasError) {
    return NextResponse.json({ error: alertasError.message }, { status: 500 });
  }

  let alertasProcessados = 0;
  let notificacoesEnviadas = 0;
  const erros: string[] = [];

  for (const alerta of (alertas ?? []) as JobAlertRow[]) {
    alertasProcessados++;

    // Só vagas publicadas depois da última verificação -- na primeira
    // corrida a fasquia é a data de criação do alerta, para não
    // inundar o candidato com todo o histórico de vagas já existentes
    // no momento em que criou o alerta.
    const desde = alerta.ultima_verificacao_em ?? alerta.created_at;

    let query = admin
      .from("jobs")
      .select("id, titulo")
      .eq("estado", "publicada")
      .gt("data_publicacao", desde);

    // Mesma lógica de pesquisa de app/empregos/page.tsx, para que um
    // alerta criado a partir de uma pesquisa continue a encontrar
    // exatamente o mesmo tipo de vaga que o candidato via na altura.
    if (alerta.termo) {
      const termo = alerta.termo.replace(/[%,]/g, "");
      query = query.or(`titulo.ilike.%${termo}%,categoria.ilike.%${termo}%`);
    }
    if (alerta.municipio_id) {
      query = query.eq("municipio_id", alerta.municipio_id);
    }
    if (alerta.modalidade) {
      query = query.eq("modalidade", alerta.modalidade);
    }

    const { data: vagas, error: vagasError } = await query;

    if (vagasError) {
      erros.push(`Alerta ${alerta.id}: ${vagasError.message}`);
      continue;
    }

    if (vagas && vagas.length > 0) {
      // upsert com ignoreDuplicates aproveita o constraint de
      // unicidade (alert_id, job_id) da migration da Fase 9: só as
      // linhas realmente novas voltam no .select(), as repetidas são
      // ignoradas silenciosamente -- é assim que evitamos notificar
      // duas vezes a mesma vaga para o mesmo alerta.
      const { data: novasCorrespondencias, error: matchError } = await admin
        .from("job_alert_matches")
        .upsert(
          (vagas as JobRow[]).map((v) => ({ alert_id: alerta.id, job_id: v.id })),
          { onConflict: "alert_id,job_id", ignoreDuplicates: true }
        )
        .select("job_id");

      if (matchError) {
        erros.push(`Alerta ${alerta.id}: ${matchError.message}`);
      } else if (novasCorrespondencias && novasCorrespondencias.length > 0) {
        const vagasPorId = new Map((vagas as JobRow[]).map((v) => [v.id, v.titulo]));

        for (const nc of novasCorrespondencias as { job_id: number }[]) {
          const titulo = vagasPorId.get(nc.job_id) ?? "uma vaga";
          const { error: notifError } = await admin.from("notifications").insert({
            user_id: alerta.candidate_id,
            type: "job_alert",
            message: `Nova vaga para o teu alerta "${alerta.nome}": ${titulo}`,
            link: `/empregos/${nc.job_id}`,
          });
          if (notifError) {
            erros.push(`Alerta ${alerta.id}, vaga ${nc.job_id}: ${notifError.message}`);
          } else {
            notificacoesEnviadas++;
          }
        }
      }
    }

    const { error: updateError } = await admin
      .from("job_alerts")
      .update({ ultima_verificacao_em: new Date().toISOString() })
      .eq("id", alerta.id);

    if (updateError) {
      erros.push(`Alerta ${alerta.id}: falhou atualizar ultima_verificacao_em -- ${updateError.message}`);
    }
  }

  return NextResponse.json({ alertasProcessados, notificacoesEnviadas, erros });
}
