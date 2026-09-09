// lib/marketplace/mediacao-tipos.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
import { z } from 'zod';

export const CATEGORIA_MEDIACAO = ['mediacao_seguros', 'creditacao'] as const;

export type CategoriaMediacao = (typeof CATEGORIA_MEDIACAO)[number];

export const CATEGORIA_SLUGS: Record<CategoriaMediacao, string> = {
  mediacao_seguros: 'mediacao-seguros',
  creditacao: 'mediacao-creditacao',
};

export const CATEGORIA_NOMES: Record<CategoriaMediacao, string> = {
  mediacao_seguros: 'Mediação de Seguros',
  creditacao: 'Mediação de Créditos',
};

export const TIPOS_SEGUROS = [
  'Automóvel',
  'Habitação',
  'Saúde',
  'Vida',
  'Responsabilidade civil',
  'Multiriscos',
  'Acidentes pessoais',
  'Viagem',
  'Negócio/Empresa',
  'Proteção familiar',
] as const;

export const SEGURADORAS = [
  'Fidelidade',
  'Allianz',
  'AXA',
  'Zurich',
  'Lusitânia',
  'Tranquilidade',
  'Chubb',
  'Ageas',
  'Generali',
  'Multicanal',
  'Outro',
] as const;

export const TIPOS_CREDITO = [
  'Pessoal',
  'Habitação',
  'Automóvel',
  'Consolidação de dívidas',
  'Microcrédito',
  'Negócio/Empresa',
  'Educação',
  'Investimento',
  'Construção',
] as const;

export const BANCOS = [
  'CGD',
  'BPI',
  'Santander',
  'Crédito Agrícola',
  'BES',
  'Novo Banco',
  'Millenium BCP',
  'Caixabank',
  'Activo Bank',
  'EuroBanc',
  'Outro',
] as const;

export interface HorarioMediacao {
  seg: string;
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
}

export const CERTIFICACOES = [
  'CORRETORA DE SEGUROS',
  'AGENTE DE SEGUROS',
  'CONSULTOR FINANCEIRO',
  'ASSESSOR CRÉDITO',
  'ESPECIALISTA PEP',
  'FORMADO COMPLIANCE',
] as const;

const validarHorario = (h: string): boolean => {
  if (!h || h.trim() === '') return true;
  return /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(h);
};

export const MediacaoFormSchema = z.object({
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres').max(100, 'Nome máximo 100 caracteres'),
  descricao: z.string().max(500, 'Descrição máximo 500 caracteres').optional().default(''),
  cae: z
    .string()
    .regex(/^\d{5}$/, 'Código CAE deve ter 5 dígitos')
    .optional()
    .or(z.literal('')),
  categoria: z.enum(CATEGORIA_MEDIACAO),
  telefone: z
    .string()
    .regex(/^[0-9]{9}$/, 'Telefone deve ter 9 dígitos')
    .or(z.string().regex(/^\+351[0-9]{9}$/, 'Ou +351 + 9 dígitos')),
  email: z.string().email('Email inválido'),
  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(200, 'Endereço máximo 200 caracteres'),
  especialidades: z.array(z.string()).min(1, 'Escolhe pelo menos uma especialidade'),
  parceiros: z.array(z.string()).min(1, 'Escolhe pelo menos um parceiro'),
  certificacoes: z.array(z.enum(CERTIFICACOES)).min(1, 'Escolhe pelo menos uma certificação'),
  profissionais: z.string().max(500, 'Máximo 500 caracteres').optional().default(''),
  horarios: z
    .object({
      seg: z.string().refine(validarHorario, 'Formato inválido'),
      ter: z.string().refine(validarHorario, 'Formato inválido'),
      qua: z.string().refine(validarHorario, 'Formato inválido'),
      qui: z.string().refine(validarHorario, 'Formato inválido'),
      sex: z.string().refine(validarHorario, 'Formato inválido'),
      sab: z.string().refine(validarHorario, 'Formato inválido'),
      dom: z.string().refine(validarHorario, 'Formato inválido'),
    })
    .optional(),
  aceita_consulta_online: z.boolean().default(true),
  link_agendamento: z.string().url().optional().or(z.literal('')),
  taxa_media_cobrada: z.coerce.number().min(0, 'Taxa não pode ser negativa').max(100, 'Taxa máxima 100%').optional(),
  fotos: z.array(z.instanceof(File)).max(5, 'Máximo 5 documentos/fotos').optional(),
});

export type MediacaoFormData = z.infer<typeof MediacaoFormSchema>;

export interface MediacaoDisplay {
  id: number;
  nome: string;
  categoria: CategoriaMediacao;
  descricao?: string;
  cae?: string;
  telefone: string;
  email: string;
  endereco: string;
  especialidades: string[];
  parceiros: string[];
  certificacoes: string[];
  profissionais?: string;
  horarios: HorarioMediacao;
  aceita_consulta_online: boolean;
  link_agendamento?: string;
  taxa_media_cobrada?: number;
  fotos: Array<{ url: string; ordem: number }>;
  author_id: string;
  created_at: string;
  updated_at: string;
}
