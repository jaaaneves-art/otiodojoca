import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Insere dados de teste para o fluxo de reservas de alojamento (Phase 7).
// Idempotente: se "Hotel Tio do Joca" já existir, reaproveita os IDs em
// vez de criar duplicados a cada chamada.
//
// Uso: POST http://localhost:3000/api/seed

const LOCALIZACAO_TESTE = {
  codigo_postal: "1100-201",
  nome: "Lisboa",
  localidade: "Lisboa",
  municipio: "Lisboa",
  distrito: "Lisboa",
  latitude: 38.7223,
  longitude: -9.1393,
};

const ALOJAMENTO_TESTE = {
  nome: "Hotel Tio do Joca",
  descricao: "Hotel encantador no coração de Lisboa",
  tipo: "hotel" as const,
  preco_noite: 85,
  num_quartos: 5,
};

const REFEICOES_TESTE = [
  { tipo_refeicao: "pequeno_almoco", preco_extra: 12, disponivel: true },
  { tipo_refeicao: "almoço", preco_extra: 18, disponivel: true },
  { tipo_refeicao: "jantar", preco_extra: 22, disponivel: true },
];

export async function POST() {
  try {
    const supabase = createAdminClient();
    // 1. Localização — reaproveita se já existir
    let localizacaoId: number;
    const { data: localizacaoExistente } = await supabase
      .from("localizacoes")
      .select("id")
      .eq("nome", LOCALIZACAO_TESTE.nome)
      .eq("codigo_postal", LOCALIZACAO_TESTE.codigo_postal)
      .maybeSingle();

    if (localizacaoExistente) {
      localizacaoId = localizacaoExistente.id;
    } else {
      const { data: novaLocalizacao, error: erroLocalizacao } = await supabase
        .from("localizacoes")
        .insert([LOCALIZACAO_TESTE])
        .select("id")
        .single();

      if (erroLocalizacao || !novaLocalizacao) {
        throw new Error(
          `Erro ao inserir localização: ${erroLocalizacao?.message}`
        );
      }
      localizacaoId = novaLocalizacao.id;
    }

    // 2. Alojamento — reaproveita se já existir
    let alojamentoId: number;
    const { data: alojamentoExistente } = await supabase
      .from("alojamentos")
      .select("id")
      .eq("nome", ALOJAMENTO_TESTE.nome)
      .maybeSingle();

    if (alojamentoExistente) {
      alojamentoId = alojamentoExistente.id;
    } else {
      const { data: novoAlojamento, error: erroAlojamento } = await supabase
        .from("alojamentos")
        .insert([{ ...ALOJAMENTO_TESTE, localizacao_id: localizacaoId }])
        .select("id")
        .single();

      if (erroAlojamento || !novoAlojamento) {
        throw new Error(
          `Erro ao inserir alojamento: ${erroAlojamento?.message}`
        );
      }
      alojamentoId = novoAlojamento.id;
    }

    // 3. Refeições — reaproveita as que já existirem para este alojamento
    const { data: refeicoesExistentes } = await supabase
      .from("refeicoes_alojamento")
      .select("id, tipo_refeicao")
      .eq("alojamento_id", alojamentoId);

    const tiposExistentes = new Set(
      (refeicoesExistentes || []).map((r) => r.tipo_refeicao)
    );
    const refeicoesEmFalta = REFEICOES_TESTE.filter(
      (r) => !tiposExistentes.has(r.tipo_refeicao)
    ).map((r) => ({ ...r, alojamento_id: alojamentoId }));

    let refeicaoIds = (refeicoesExistentes || []).map((r) => r.id);

    if (refeicoesEmFalta.length > 0) {
      const { data: novasRefeicoes, error: erroRefeicoes } = await supabase
        .from("refeicoes_alojamento")
        .insert(refeicoesEmFalta)
        .select("id");

      if (erroRefeicoes) {
        throw new Error(`Erro ao inserir refeições: ${erroRefeicoes.message}`);
      }
      refeicaoIds = refeicaoIds.concat((novasRefeicoes || []).map((r) => r.id));
    }

    return NextResponse.json({
      success: true,
      data: {
        localizacaoId,
        alojamentoId,
        refeicaoIds,
        message: "Test data inserted successfully",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
