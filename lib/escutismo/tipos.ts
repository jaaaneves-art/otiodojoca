// lib/escutismo/tipos.ts
//
// CRIADO 13/09/2026 — tipos e validação Zod para as server actions do
// Escutismo (lib/escutismo/actions.ts). Nomes de campos alinhados com o
// schema real em produção (tabela escutismo_membros), não com o documento
// docs/pendentes/ESCUTISMO-20260904.md (esse descreve uma versão "v5" que
// nunca chegou a ser aplicada tal e qual — ver nota no topo de actions.ts).

import { z } from 'zod';

export const InscricaoEscuteiroSchema = z.object({
  nome: z.string().trim().min(2, 'Nome demasiado curto').max(120, 'Nome demasiado longo'),
  // Formato AAAA-MM-DD (o que um <input type="date"> envia). A validação de
  // "é mesmo uma data válida" e o cálculo de e_menor ficam do lado da base
  // de dados (trigger escutismo_set_menor) — aqui só se confirma a forma.
  data_nascimento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (AAAA-MM-DD)')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Data de nascimento inválida'),
  escalao: z.string().trim().min(1, 'Escalão obrigatório').max(60),
});
export type InscricaoEscuteiroData = z.infer<typeof InscricaoEscuteiroSchema>;

export const PedidoAdesaoSchema = z.object({
  agrupamento_id: z.string().uuid('Agrupamento inválido'),
});
export type PedidoAdesaoData = z.infer<typeof PedidoAdesaoSchema>;

export const DecisaoPedidoSchema = z.object({
  pedido_id: z.string().uuid('Pedido inválido'),
  decisao: z.enum(['aprovado', 'rejeitado']),
  motivo: z.string().trim().max(500).optional(),
});
export type DecisaoPedidoData = z.infer<typeof DecisaoPedidoSchema>;

export interface EscutismoMembroView {
  id: string;
  user_id: string;
  agrupamento_id: string | null;
  nome: string;
  data_nascimento: string;
  escalao: string;
  estado: 'pendente' | 'ativo' | 'rejeitado' | 'suspenso' | 'saiu';
  e_menor: boolean;
  tutoria_id: string | null;
  consentimento_dado: boolean;
  consentimento_token: string | null;
  consentimento_em: string | null;
  criado_em: string;
  atualizado_em: string;
  idade: number;
  menor_agora: boolean;
}
