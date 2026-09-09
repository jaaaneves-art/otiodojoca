// lib/marketplace/beleza-types.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
import { z } from 'zod';

export const CATEGORIA_BELEZA = ['unhas', 'cabelo', 'esteticista', 'barba_conexos'] as const;

export type CategoriaBeleza = (typeof CATEGORIA_BELEZA)[number];

export const CATEGORIA_SLUGS: Record<CategoriaBeleza, string> = {
  unhas: 'beleza-unhas',
  cabelo: 'beleza-cabelo',
  esteticista: 'beleza-esteticista',
  barba_conexos: 'beleza-barba-conexos',
};

export const CATEGORIA_NOMES: Record<CategoriaBeleza, string> = {
  unhas: 'Serviços de Unhas',
  cabelo: 'Cabeleireiro',
  esteticista: 'Esteticista',
  barba_conexos: 'Barba & Serviços Conexos',
};

export const SERVICOS_UNHAS = [
  'Manicure',
  'Pedicure',
  'Gel',
  'Acrílico',
  'Esmaltagem',
  'Limpeza cuticulas',
  'Tratamento hidrante',
] as const;

export const SERVICOS_CABELO = [
  'Corte homem',
  'Corte mulher',
  'Coloração',
  'Mechas',
  'Alisamento',
  'Permanente',
  'Tratamento capilar',
  'Escova progressiva',
  'Botox capilar',
] as const;

export const SERVICOS_ESTETICISTA = [
  'Depilação cera',
  'Depilação laser',
  'Limpeza facial',
  'Hidratação',
  'Peeling',
  'Massagem facial',
  'Drenagem linfática',
  'Microblading',
  'Sobrancelhas design',
] as const;

export const SERVICOS_BARBA = [
  'Corte barba',
  'Barbear tradicional',
  'Penteado/styling',
  'Massagem cabeça',
  'Limpeza facial homem',
  'Tratamento pele',
] as const;

export const SERVICOS_POR_CATEGORIA: Record<CategoriaBeleza, readonly string[]> = {
  unhas: SERVICOS_UNHAS,
  cabelo: SERVICOS_CABELO,
  esteticista: SERVICOS_ESTETICISTA,
  barba_conexos: SERVICOS_BARBA,
};

export interface HorarioBeleza {
  seg: string;
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
}

export interface ServicoPreco {
  nome: string;
  preco: number;
  duracao_minutos?: number;
}

const validarHorario = (h: string): boolean => {
  if (!h || h.trim() === '') return true;
  return /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(h);
};

export const BelezaFormSchema = z.object({
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres').max(100, 'Nome máximo 100 caracteres'),
  descricao: z.string().max(500, 'Descrição máximo 500 caracteres').optional().default(''),
  cae: z
    .string()
    .regex(/^\d{5}$/, 'Código CAE deve ter 5 dígitos')
    .optional()
    .or(z.literal('')),
  categoria: z.enum(CATEGORIA_BELEZA),
  telefone: z
    .string()
    .regex(/^[0-9]{9}$/, 'Telefone deve ter 9 dígitos')
    .or(z.string().regex(/^\+351[0-9]{9}$/, 'Ou +351 + 9 dígitos')),
  email: z.string().email('Email inválido'),
  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(200, 'Endereço máximo 200 caracteres'),
  profissionais: z.string().max(500, 'Máximo 500 caracteres').optional().default(''),
  servicos: z.array(z.string()).min(1, 'Escolhe pelo menos um serviço'),
  servicos_com_preco: z
    .array(
      z.object({
        nome: z.string(),
        preco: z.coerce.number().min(0, 'Preço não pode ser negativo'),
        duracao_minutos: z.coerce.number().optional(),
      })
    )
    .optional(),
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
  aceita_agendamento_online: z.boolean().default(false),
  link_agendamento: z.string().url().optional().or(z.literal('')),
  fotos: z.array(z.instanceof(File)).max(3, 'Máximo 3 fotos').optional(),
});

export type BelezaFormData = z.infer<typeof BelezaFormSchema>;

export interface BelezaDisplay {
  id: number;
  nome: string;
  categoria: CategoriaBeleza;
  descricao?: string;
  cae?: string;
  telefone: string;
  email: string;
  endereco: string;
  profissionais?: string;
  servicos: string[];
  horarios: HorarioBeleza;
  servicos_com_preco?: ServicoPreco[];
  aceita_agendamento_online: boolean;
  link_agendamento?: string;
  fotos: Array<{ url: string; ordem: number }>;
  author_id: string;
  created_at: string;
  updated_at: string;
}
