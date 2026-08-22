// lib/alojamento/actions.ts

'use server';

import { createClient } from '@/lib/supabase/server';
import type {
  Alojamento,
  AlojamentoComLocalizacao,
  AlojamentoComRefeicoes,
  RefeicaoAlojamento,
  ReservaAlojamento,
  TipoRefeicao,
} from './tipos';

// ========================================
// ALOJAMENTOS
// ========================================

const CAMPOS_LOCALIZACAO_RESUMO = `
  localizacao:localizacoes (
    id, nome, localidade, municipio, distrito, codigo_postal, morada, latitude, longitude
  )
`;

/**
 * O PostgREST às vezes devolve a relação embutida como array, às vezes
 * como objeto único, consoante consiga inferir a cardinalidade da FK.
 * Normalizamos aqui para ficar sempre um objeto (ou null).
 */
function normalizarLocalizacao<T extends { localizacao?: unknown }>(
  registo: T
): T {
  const bruto = registo.localizacao as unknown;
  const localizacao = Array.isArray(bruto) ? (bruto[0] ?? null) : (bruto ?? null);
  return { ...registo, localizacao };
}

/**
 * Listar todos os alojamentos, com a localização (morada, código postal,
 * localidade, município, distrito, GPS) já incluída para a listagem.
 */
export async function listarAlojamentos() {
  const supabase = await createClient();

  const { data: alojamentos, error } = await supabase
    .from('alojamentos')
    .select(`
      id, nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, rating, created_at, updated_at,
      ${CAMPOS_LOCALIZACAO_RESUMO}
    `)
    .order('nome');

  if (error) {
    throw new Error(`Erro ao listar alojamentos: ${error.message}`);
  }

  return (alojamentos || []).map(normalizarLocalizacao) as Alojamento[];
}

/**
 * Obter um alojamento com localização completa
 */
export async function obterAlojamento(id: number) {
  const supabase = await createClient();

  // Query 1: Alojamento
  const { data: alojamento, error: erroAlojamento } = await supabase
    .from('alojamentos')
    .select('*')
    .eq('id', id)
    .single();

  if (erroAlojamento || !alojamento) {
    throw new Error('Alojamento não encontrado');
  }

  // Query 2: Localização
  const { data: localizacao, error: erroLocalizacao } = await supabase
    .from('localizacoes')
    .select('*')
    .eq('id', alojamento.localizacao_id)
    .single();

  if (erroLocalizacao) {
    throw new Error('Localização não encontrada');
  }

  return {
    ...alojamento,
    localizacao,
  } as AlojamentoComLocalizacao;
}

/**
 * Obter alojamento com refeições disponíveis
 */
export async function obterAlojamentoComRefeicoes(id: number) {
  const supabase = await createClient();

  // Query 1: Alojamento com localização
  const alojamento = await obterAlojamento(id);

  // Query 2: Refeições
  const { data: refeicoes, error: erroRefeicoes } = await supabase
    .from('refeicoes_alojamento')
    .select('*')
    .eq('alojamento_id', id)

  if (erroRefeicoes) {
    throw new Error('Erro ao buscar refeições');
  }

  return {
    ...alojamento,
    refeicoes: refeicoes || [],
  } as AlojamentoComRefeicoes;
}

/**
 * Filtrar alojamentos por tipo
 */
export async function filtrarAlojamentosPorTipo(tipo: string) {
  const supabase = await createClient();

  const { data: alojamentos, error } = await supabase
    .from('alojamentos')
    .select(`
      id, nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, rating, created_at, updated_at,
      ${CAMPOS_LOCALIZACAO_RESUMO}
    `)
    .eq('tipo', tipo)
    .order('nome');

  if (error) {
    throw new Error(`Erro ao filtrar alojamentos: ${error.message}`);
  }

  return (alojamentos || []).map(normalizarLocalizacao) as Alojamento[];
}

/**
 * Filtrar alojamentos por preço
 */
export async function filtrarAlojamentosPorPreco(precoMin: number, precoMax: number) {
  const supabase = await createClient();

  const { data: alojamentos, error } = await supabase
    .from('alojamentos')
    .select(`
      id, nome, descricao, tipo, localizacao_id, preco_noite, num_quartos, rating, created_at, updated_at,
      ${CAMPOS_LOCALIZACAO_RESUMO}
    `)
    .gte('preco_noite', precoMin)
    .lte('preco_noite', precoMax)
    .order('preco_noite');

  if (error) {
    throw new Error(`Erro ao filtrar por preço: ${error.message}`);
  }

  return (alojamentos || []).map(normalizarLocalizacao) as Alojamento[];
}

// ========================================
// REFEIÇÕES
// ========================================

/**
 * Obter refeições disponíveis para um alojamento
 */
export async function obterRefeicoesAlojamento(alojamentoId: number) {
  const supabase = await createClient();

  const { data: refeicoes, error } = await supabase
    .from('refeicoes_alojamento')
    .select('*')
    .eq('alojamento_id', alojamentoId)

  if (error) {
    throw new Error('Erro ao buscar refeições');
  }

  return refeicoes || [];
}

// ========================================
// RESERVAS
// ========================================

/**
 * Criar nova reserva de alojamento
 */
export async function criarReservaAlojamento(dados: {
  alojamento_id: number;
  nome_hospede: string;
  email_hospede: string;
  telefone_hospede?: string;
  data_entrada: string;
  data_saida: string;
  num_pessoas: number;
  num_quartos: number;
  tipo_refeicao: TipoRefeicao;
  preco_total: number;
  observacoes?: string;
}) {
  const supabase = await createClient();

  // Validar datas
  const entrada = new Date(dados.data_entrada);
  const saida = new Date(dados.data_saida);

  if (saida <= entrada) {
    throw new Error('Data de saída deve ser após data de entrada');
  }

  // Criar reserva
  const { data: reserva, error } = await supabase
    .from('reservas_alojamento')
    .insert([
      {
        alojamento_id: dados.alojamento_id,
        nome_hospede: dados.nome_hospede,
        email_hospede: dados.email_hospede,
        telefone_hospede: dados.telefone_hospede || null,
        data_entrada: dados.data_entrada,
        data_saida: dados.data_saida,
        num_pessoas: dados.num_pessoas,
        num_quartos: dados.num_quartos,
        tipo_refeicao: dados.tipo_refeicao,
        preco_total: dados.preco_total,
        status: 'pendente',
        observacoes: dados.observacoes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar reserva: ${error.message}`);
  }

  return reserva as ReservaAlojamento;
}

/**
 * Listar reservas de um alojamento
 */
export async function listarReservasAlojamento(alojamentoId: number) {
  const supabase = await createClient();

  const { data: reservas, error } = await supabase
    .from('reservas_alojamento')
    .select('*')
    .eq('alojamento_id', alojamentoId)
    .order('data_entrada', { ascending: true });

  if (error) {
    throw new Error('Erro ao listar reservas');
  }

  return reservas || [];
}

/**
 * Obter uma reserva específica
 */
export async function obterReserva(id: number) {
  const supabase = await createClient();

  const { data: reserva, error } = await supabase
    .from('reservas_alojamento')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !reserva) {
    throw new Error('Reserva não encontrada');
  }

  return reserva as ReservaAlojamento;
}

/**
 * Atualizar status de uma reserva
 */
export async function atualizarStatusReserva(
  id: number,
  novoStatus: 'confirmada' | 'concluido' | 'cancelada'
) {
  const supabase = await createClient();

  const { data: reserva, error } = await supabase
    .from('reservas_alojamento')
    .update({ status: novoStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar reserva: ${error.message}`);
  }

  return reserva as ReservaAlojamento;
}

/**
 * Cancelar uma reserva
 */
export async function cancelarReserva(id: number, motivo?: string) {
  const supabase = await createClient();

  const { data: reserva, error } = await supabase
    .from('reservas_alojamento')
    .update({
      status: 'cancelada',
      observacoes: motivo || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao cancelar reserva: ${error.message}`);
  }

  return reserva as ReservaAlojamento;
}

/**
 * Verificar disponibilidade de um alojamento
 */
export async function verificarDisponibilidade(
  alojamentoId: number,
  dataEntrada: string,
  dataSaida: string
) {
  const supabase = await createClient();

  const { data: reservas, error } = await supabase
    .from('reservas_alojamento')
    .select('data_entrada, data_saida')
    .eq('alojamento_id', alojamentoId)
    .in('status', ['pendente', 'confirmada'])
    .or(`and(gte(data_saida,${dataEntrada}),lte(data_entrada,${dataSaida}))`);

  if (error) {
    throw new Error('Erro ao verificar disponibilidade');
  }

  return !reservas || reservas.length === 0;
}

/**
 * Calcular preço total da reserva
 */
export async function calcularPrecoReserva(
  alojamentoId: number,
  dataEntrada: string,
  dataSaida: string,
  tipoRefeicao: TipoRefeicao
) {
  // Obter alojamento
  const alojamento = await obterAlojamento(alojamentoId);

  // Calcular número de noites
  const entrada = new Date(dataEntrada);
  const saida = new Date(dataSaida);
  const numNoites = Math.ceil((saida.getTime() - entrada.getTime()) / (1000 * 60 * 60 * 24));

  if (numNoites <= 0) {
    throw new Error('Número de noites deve ser maior que zero');
  }

  // Preço base (noites × preço por noite)
  let precoTotal = numNoites * alojamento.preco_noite;

  // Adicionar refeições se houver
  if (tipoRefeicao !== 'sem_refeicoes') {
    const refeicoes = await obterRefeicoesAlojamento(alojamentoId);

    if (tipoRefeicao === 'pequeno_almoco') {
      const pequeno = refeicoes.find(r => r.tipo_refeicao === 'pequeno_almoco');
      if (pequeno?.preco_extra) {
        precoTotal += numNoites * pequeno.preco_extra;
      }
    } else if (tipoRefeicao === 'meia_pensao') {
      const almoco = refeicoes.find(r => r.tipo_refeicao === 'almoço');
      if (almoco?.preco_extra) {
        precoTotal += numNoites * almoco.preco_extra;
      }
    } else if (tipoRefeicao === 'pensao_completa') {
      const almoco = refeicoes.find(r => r.tipo_refeicao === 'almoço');
      const jantar = refeicoes.find(r => r.tipo_refeicao === 'jantar');
      if (almoco?.preco_extra) precoTotal += numNoites * almoco.preco_extra;
      if (jantar?.preco_extra) precoTotal += numNoites * jantar.preco_extra;
    }
  }

  return {
    numNoites,
    precoNoite: alojamento.preco_noite,
    precoRefeicoes: precoTotal - numNoites * alojamento.preco_noite,
    precoTotal: Math.round(precoTotal * 100) / 100,
  };
}
