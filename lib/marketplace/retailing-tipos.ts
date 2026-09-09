// lib/marketplace/retailing-tipos.ts
//
// CORRIGIDO 08/09/2026 — a versão anterior deste ficheiro assumia colunas
// que não existem no schema real (`marketplace_ads.categoria_id` como
// texto, `criador_id`, `metadata`, `publicado_em`). Ver
// docs/pendentes/RETAILING-CAE-CORRECAO-20260908.md para o detalhe da
// correção. O essencial deste ficheiro (schema Zod, campos do
// formulário) mantém-se igual ao original — só os nomes que espelhavam
// o schema errado foram ajustados.
import { z } from 'zod';

// Categorias de retailing (mapeiam para linhas em `categories`,
// type='marketplace', criadas pela migration deste módulo)
export const CATEGORIA_RETAILING = [
  'mercearia',
  'mini_mercado',
  'supermercado',
  'hipermercado',
] as const;

export type CategoriaRetailing = (typeof CATEGORIA_RETAILING)[number];

// Slug da categoria em `categories.slug` (prefixado para não colidir
// com slugs de outros módulos/áreas do site)
export const CATEGORIA_SLUGS: Record<CategoriaRetailing, string> = {
  mercearia: 'retailing-mercearia',
  mini_mercado: 'retailing-mini-mercado',
  supermercado: 'retailing-supermercado',
  hipermercado: 'retailing-hipermercado',
};

// Mapeamento de nomes
export const CATEGORIA_NOMES: Record<CategoriaRetailing, string> = {
  mercearia: 'Mercearia',
  mini_mercado: 'Mini Mercado',
  supermercado: 'Supermercado',
  hipermercado: 'Hipermercado',
};

// Descrições por categoria
export const CATEGORIA_DESCRICOES: Record<CategoriaRetailing, string> = {
  mercearia: 'Loja pequena de produtos alimentares e convenientes',
  mini_mercado: 'Loja pequena-média de conveniência e proximidade',
  supermercado: 'Loja média com múltiplos departamentos',
  hipermercado: 'Grande distribuição com ampla variedade de produtos',
};

// ============================================
// DEPARTAMENTOS/SECÇÕES
// ============================================
export const DEPARTAMENTOS = [
  'Alimentação geral',
  'Bebidas',
  'Lácteos e queijos',
  'Carnes e embutidos',
  'Peixes e marisco',
  'Frutas e verduras',
  'Congelados',
  'Higiene pessoal',
  'Limpeza e casa',
  'Bebés',
  'Pet care',
  'Tabaco',
  'Jornais e revistas',
  'Confeitaria e pão',
  'Charcutaria',
  'Eletrónicos',
  'Roupas e moda',
  'Móveis e casa',
  'Desporto e lazer',
  'Livros e media',
] as const;

// ============================================
// SERVIÇOS ADICIONAIS
// ============================================
export const SERVICOS_ADICIONAIS = [
  'ATM/Multibanco',
  'Estacionamento',
  'Entrega ao domicílio',
  'Compras online',
  'Caixa de crédito',
  'Balcão de vinho',
  'Deli/Pronto a comer',
  'Serviços postais',
  'Encomendas',
  'Farmácia',
  'Lotaria/Jogos',
  'Sala de espera/café',
  'Serviços bancários',
] as const;

// ============================================
// PROGRAMAS LEALDADE
// ============================================
export const PROGRAMAS_LEALDADE = [
  'Cartão de cliente',
  'Programa de pontos',
  'Descontos progressivos',
  'Promoções semanais',
  'Cupões digitais',
  'App própria',
  'Nenhum',
] as const;

// ============================================
// HORÁRIOS
// ============================================
export interface HorarioRetailing {
  seg: string; // "08:00-22:00"
  ter: string;
  qua: string;
  qui: string;
  sex: string;
  sab: string;
  dom: string;
}

const validarHorario = (h: string): boolean => {
  if (!h || h.trim() === '') return true;
  return /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(h);
};

// ============================================
// SCHEMA ZOD UNIFICADO
// ============================================
export const RetailingFormSchema = z.object({
  // Identificação
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres').max(100, 'Nome máximo 100 caracteres'),

  descricao: z.string().max(500, 'Descrição máximo 500 caracteres').optional().default(''),

  // Código CAE (opcional) — ver lib/marketplace/cae.ts
  cae: z
    .string()
    .regex(/^\d{5}$/, 'Código CAE deve ter 5 dígitos')
    .optional()
    .or(z.literal('')),

  // Categoria
  categoria: z.enum(CATEGORIA_RETAILING),

  // Contacto
  telefone: z
    .string()
    .regex(/^[0-9]{9}$/, 'Telefone deve ter 9 dígitos')
    .or(z.string().regex(/^\+351[0-9]{9}$/, 'Ou +351 + 9 dígitos')),

  email: z.string().email('Email inválido').optional(),

  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres').max(200, 'Endereço máximo 200 caracteres'),

  // Loja
  area_metros_quadrados: z.coerce.number().min(10, 'Área mínima 10 m²').max(100000, 'Área máxima 100.000 m²').optional(),

  ano_abertura: z.coerce
    .number()
    .min(1900, 'Ano inválido')
    .max(new Date().getFullYear(), 'Ano no futuro')
    .optional(),

  // Departamentos
  departamentos: z.array(z.string()).min(1, 'Escolhe pelo menos um departamento'),

  // Serviços adicionais
  servicos_adicionais: z.array(z.string()).optional(),

  // Programa lealdade
  programa_lealdade: z.string().optional(),
  descricao_programa: z.string().max(300, 'Máximo 300 caracteres').optional(),

  // Horários
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

  // Info comercial
  metodos_pagamento: z.array(z.string()).min(1, 'Escolhe pelo menos um método de pagamento'),

  aceita_multibanco: z.boolean().default(true),
  aceita_cartao: z.boolean().default(true),
  aceita_mbway: z.boolean().default(false),
  aceita_criptomoedas: z.boolean().default(false),

  // Fotos
  fotos: z.array(z.instanceof(File)).max(5, 'Máximo 5 fotos').optional(),
});

export type RetailingFormData = z.infer<typeof RetailingFormSchema>;

// Interface para pré-preencher o formulário em modo "editar"
export interface RetailingDisplay {
  id: number;
  nome: string;
  categoria: CategoriaRetailing;
  descricao?: string;
  cae?: string;
  telefone: string;
  email?: string;
  endereco: string;
  area_metros_quadrados?: number;
  ano_abertura?: number;
  departamentos: string[];
  servicos_adicionais: string[];
  programa_lealdade?: string;
  descricao_programa?: string;
  horarios: HorarioRetailing;
  metodos_pagamento: string[];
  aceita_multibanco: boolean;
  aceita_cartao: boolean;
  aceita_mbway: boolean;
  aceita_criptomoedas: boolean;
  fotos: Array<{ url: string; ordem: number }>;
  author_id: string;
  created_at: string;
  updated_at: string;
}
