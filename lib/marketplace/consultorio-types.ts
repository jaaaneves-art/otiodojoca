// lib/marketplace/consultorio-types.ts
// CORRIGIDO 08/09/2026 — ver docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md
import { z } from 'zod';

export const ESPECIALIDADES = [
  'Geral',
  'Pediatria',
  'Dentista',
  'Oftalmologia',
  'Psicologia',
  'Fisioterapia',
  'Ortopedia',
  'Cardiologia',
  'Dermatologia',
  'Otorrino',
] as const;

export const DIAS_SEMANA = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'] as const;

// Categoria única "Consultório Médico" em `categories` (type='marketplace')
export const CONSULTORIO_CATEGORIA_SLUG = 'consultorio-medico';

export interface HorarioConsultorio {
  seg: string; // "09:00-12:00,14:00-18:00"
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
}

const validarHorario = (h: string): boolean => {
  if (!h || h.trim() === '') return true;
  const partes = h.split(',').map((p) => p.trim());
  return partes.every((p) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(p));
};

export const ConsultorioFormSchema = z.object({
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres').max(100, 'Nome máximo 100 caracteres'),
  descricao: z.string().max(500, 'Descrição máximo 500 caracteres').optional().default(''),
  cae: z
    .string()
    .regex(/^\d{5}$/, 'Código CAE deve ter 5 dígitos')
    .optional()
    .or(z.literal('')),
  telefone: z
    .string()
    .regex(/^[0-9]{9}$/, 'Telefone deve ter 9 dígitos (sem +351)')
    .or(z.string().regex(/^\+351[0-9]{9}$/, 'Ou +351 + 9 dígitos')),
  email: z.string().email('Email inválido'),
  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(200, 'Endereço máximo 200 caracteres'),
  especialidades: z.array(z.enum(ESPECIALIDADES)).min(1, 'Escolhe pelo menos uma especialidade'),
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
  aceita_seguros: z.boolean().default(false),
  preco_consulta: z.coerce.number().min(0, 'Preço não pode ser negativo').optional(),
  fotos: z.array(z.instanceof(File)).max(3, 'Máximo 3 fotos').optional(),
});

export type ConsultorioFormData = z.infer<typeof ConsultorioFormSchema>;

export interface ConsultorioDisplay {
  id: number;
  nome: string;
  especialidades: string[];
  telefone: string;
  email: string;
  endereco: string;
  descricao?: string;
  cae?: string;
  horarios: HorarioConsultorio;
  aceita_seguros: boolean;
  preco_consulta?: number;
  profissionais?: string;
  fotos: Array<{ url: string; ordem: number }>;
  author_id: string;
  created_at: string;
  updated_at: string;
}
