// lib/escutismo/actions.ts
//
// CRIADO 13/09/2026 — Fase 2 do Escutismo (server actions), âmbito reduzido
// a pedido do Yos: inscrição de escuteiro + pedido de adesão a um
// agrupamento + decisão do(s) responsável(eis). Ver
// docs/pendentes/ESCUTISMO-20260904.md para o plano original de 04/09 — ESSE
// DOCUMENTO ESTÁ DESATUALIZADO quanto a nomes de tabelas e funções. O schema
// realmente aplicado em produção ("v1", 06/09, reconciliado com a tabela
// genérica `tutorias` em 12/09) usa escutismo_membros,
// escutismo_pedidos_adesao e escutismo_pedido_aprovacoes — não as tabelas
// escutismo_tutor_convites / escutismo_confirmacoes_pendentes que o
// documento descreve. Este ficheiro segue o schema real, confirmado por
// introspecção direta (information_schema, pg_policies, pg_proc) em 13/09.
//
// FORA DE ÂMBITO NESTA VERSÃO — decisão em aberto, não é código por fazer:
// como fica confirmado o consentimento do tutor de um menor.
// `escutismo_membros` tem consentimento_token/consentimento_dado próprios,
// mas o projeto TAMBÉM já tem um sistema genérico de tutoria confirmada
// (tabela `tutorias` + função `e_tutor_confirmado_de()`, usado por
// `adesao_aprovar_tutor()` no módulo de Adesões). Por decidir: o Escutismo
// deve reutilizar esse sistema genérico (mais consistente com o resto da
// plataforma, evita duplicar verificação de tutor — mas exige que o tutor
// já tenha uma `tutoria` confirmada com o perfil do menor), ou manter um
// fluxo próprio de token por email (mais isolado, mas duplica lógica e
// depende do SendGrid, hoje pausado)? Enquanto isto não for decidido, não
// existe aqui nenhuma função `registarConsentimentoTutor()` — escrevê-la às
// cegas arriscava construir sobre o sistema errado. Até lá,
// `consentimento_dado` fica `false` por omissão e um menor NUNCA passa a
// `estado='ativo'`: a constraint `escut_menor_ativo_exige_consentimento` da
// base de dados garante isto mesmo que haja um erro neste ficheiro — ver
// escutismo_processa_aprovacao() no fundo, que só ativa o membro
// "(NOT m.e_menor OR m.consentimento_dado)".
'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import {
  InscricaoEscuteiroSchema,
  InscricaoEscuteiroData,
  PedidoAdesaoSchema,
  DecisaoPedidoSchema,
  EscutismoMembroView,
} from './tipos';

type ResultadoOk<T> = { sucesso: true; dados: T };
type ResultadoErro = { sucesso: false; erro: string };
type Resultado<T> = ResultadoOk<T> | ResultadoErro;

/**
 * Regista uma linha em escutismo_auditoria via service role — política RLS
 * da tabela só permite SELECT a nacional_cne, não há INSERT para
 * utilizadores normais (por desenho: o log tem de ser imutável do ponto de
 * vista do utilizador). Nunca deixa uma falha de auditoria rebentar o fluxo
 * principal.
 */
async function registarAuditoria(
  atorUserId: string | null,
  acao: string,
  entidade: string,
  entidadeId: string | null,
  detalhe: Record<string, unknown> = {}
) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('escutismo_auditoria').insert({
      ator_user_id: atorUserId,
      acao,
      entidade,
      entidade_id: entidadeId,
      detalhe,
    });
    if (error) console.error('[escutismo] Falha ao gravar auditoria:', error);
  } catch (erro) {
    console.error('[escutismo] Falha ao registar auditoria:', erro);
  }
}

/** Traduz erros comuns do Postgres/PostgREST para mensagens de utilizador. */
function traduzirErro(error: { code?: string; message: string }, duplicadoMsg: string): string {
  if (error.code === '23505') return duplicadoMsg;
  if (error.code === '42501' || /row-level security/i.test(error.message)) {
    return 'Não tens permissão para esta ação.';
  }
  return error.message;
}

export async function inscreverEscuteiro(
  dados: InscricaoEscuteiroData
): Promise<Resultado<{ membroId: string; eMenor: boolean }>> {
  try {
    const validado = InscricaoEscuteiroSchema.parse(dados);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sucesso: false, erro: 'É preciso iniciar sessão.' };

    // e_menor NÃO é calculado aqui — o trigger escutismo_set_menor calcula-o
    // sempre a partir de data_nascimento antes do INSERT. O valor devolvido
    // abaixo vem da base de dados, não de um cálculo do lado do servidor
    // Next.js, para não haver duas fórmulas a poder divergir.
    const { data: membro, error } = await supabase
      .from('escutismo_membros')
      .insert({
        user_id: user.id,
        nome: validado.nome,
        data_nascimento: validado.data_nascimento,
        escalao: validado.escalao,
        estado: 'pendente',
      })
      .select('id, e_menor')
      .single();

    if (error) {
      return { sucesso: false, erro: traduzirErro(error, 'Já tens uma inscrição de escutismo associada a esta conta.') };
    }

    await registarAuditoria(user.id, 'inscricao_criada', 'escutismo_membros', membro.id, {
      escalao: validado.escalao,
      e_menor: membro.e_menor,
    });

    revalidatePath('/escutismo');

    return { sucesso: true, dados: { membroId: membro.id, eMenor: membro.e_menor } };
  } catch (erro) {
    console.error('[escutismo] Erro ao inscrever escuteiro:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

export async function pedirAdesaoAgrupamento(agrupamentoId: string): Promise<Resultado<{ pedidoId: string }>> {
  try {
    const { agrupamento_id } = PedidoAdesaoSchema.parse({ agrupamento_id: agrupamentoId });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sucesso: false, erro: 'É preciso iniciar sessão.' };

    const { data: membro, error: membroError } = await supabase
      .from('escutismo_membros')
      .select('id, escalao, agrupamento_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membroError) throw membroError;
    if (!membro) {
      return { sucesso: false, erro: 'Ainda não tens uma inscrição de escutismo — inscreve-te primeiro.' };
    }
    if (membro.agrupamento_id) {
      return { sucesso: false, erro: 'Já pertences a um agrupamento.' };
    }

    const { data: agrupamento, error: agrupError } = await supabase
      .from('escutismo_agrupamentos')
      .select('id, estado, escutismo_associacoes(escaloes)')
      .eq('id', agrupamento_id)
      .maybeSingle();

    if (agrupError) throw agrupError;
    if (!agrupamento) {
      return { sucesso: false, erro: 'Agrupamento não encontrado.' };
    }
    if (agrupamento.estado !== 'ativo') {
      return { sucesso: false, erro: 'Este agrupamento ainda não está ativo.' };
    }

    // Validação de escalão feita aqui de propósito: o trigger
    // escutismo_valida_escalao ignora-a enquanto agrupamento_id está a null
    // ("sem agrupamento ainda, valida-se na adesão" — comentário da própria
    // função), e agrupamento_id só é preenchido depois de aprovado.
    const associacao = agrupamento.escutismo_associacoes as unknown as { escaloes: string[] } | null;
    const escaloesValidos = associacao?.escaloes;
    if (escaloesValidos && !escaloesValidos.includes(membro.escalao)) {
      return {
        sucesso: false,
        erro: `O escalão "${membro.escalao}" não existe nesta associação. Válidos: ${escaloesValidos.join(', ')}.`,
      };
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from('escutismo_pedidos_adesao')
      .insert({ membro_id: membro.id, agrupamento_id })
      .select('id')
      .single();

    if (pedidoError) {
      return { sucesso: false, erro: traduzirErro(pedidoError, 'Já tens um pedido de adesão em curso.') };
    }

    await registarAuditoria(user.id, 'pedido_adesao_criado', 'escutismo_pedidos_adesao', pedido.id, {
      agrupamento_id,
    });

    revalidatePath('/escutismo');

    return { sucesso: true, dados: { pedidoId: pedido.id } };
  } catch (erro) {
    console.error('[escutismo] Erro ao pedir adesão:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

/**
 * Um responsável do agrupamento decide um pedido de adesão. A ativação em
 * si (2 aprovações, ou 1 rejeição chega) acontece dentro do trigger
 * escutismo_processa_aprovacao — esta ação só regista a decisão individual.
 */
export async function decidirPedidoAdesao(
  pedidoId: string,
  decisao: 'aprovado' | 'rejeitado',
  motivo?: string
): Promise<Resultado<Record<string, never>>> {
  try {
    const validado = DecisaoPedidoSchema.parse({ pedido_id: pedidoId, decisao, motivo });
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sucesso: false, erro: 'É preciso iniciar sessão.' };

    const { error } = await supabase.from('escutismo_pedido_aprovacoes').insert({
      pedido_id: validado.pedido_id,
      responsavel_user_id: user.id,
      decisao: validado.decisao,
      motivo: validado.motivo ?? null,
    });

    if (error) {
      return {
        sucesso: false,
        erro: traduzirErro(error, 'Já registaste uma decisão para este pedido.'),
      };
    }

    await registarAuditoria(user.id, `pedido_${validado.decisao}`, 'escutismo_pedidos_adesao', validado.pedido_id, {
      motivo: validado.motivo,
    });

    revalidatePath('/escutismo/confirmacoes');

    return { sucesso: true, dados: {} };
  } catch (erro) {
    console.error('[escutismo] Erro ao decidir pedido de adesão:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

/** Lê o próprio estado (view já calcula idade/menor_agora). */
export async function obterMeuEstadoEscutismo(): Promise<Resultado<EscutismoMembroView | null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sucesso: false, erro: 'É preciso iniciar sessão.' };

    const { data, error } = await supabase
      .from('escutismo_membros_v')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return { sucesso: true, dados: data as EscutismoMembroView | null };
  } catch (erro) {
    console.error('[escutismo] Erro ao obter estado:', erro);
    return { sucesso: false, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}

/** Pedidos pendentes que o utilizador atual pode decidir (é responsável do agrupamento). */
export async function listarPedidosPendentesParaDecidir() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sucesso: false as const, erro: 'É preciso iniciar sessão.' };

    // RLS (escut_pedidos_select) já filtra para só devolver pedidos do(s)
    // agrupamento(s) onde o utilizador é responsável, ou tudo se nacional.
    const { data, error } = await supabase
      .from('escutismo_pedidos_adesao')
      .select('id, estado, criado_em, agrupamento_id, escutismo_membros(nome, escalao, e_menor, consentimento_dado)')
      .eq('estado', 'pendente')
      .order('criado_em', { ascending: true });

    if (error) throw error;

    return { sucesso: true as const, dados: data };
  } catch (erro) {
    console.error('[escutismo] Erro ao listar pedidos pendentes:', erro);
    return { sucesso: false as const, erro: erro instanceof Error ? erro.message : 'Erro desconhecido' };
  }
}
