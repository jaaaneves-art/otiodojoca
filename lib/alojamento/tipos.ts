// lib/alojamento/tipos.ts

export type TipoAlojamento = 
  | 'hotel' 
  | 'pousada' 
  | 'casa_rural' 
  | 'hostel' 
  | 'apartamento' 
  | 'chalé' 
  | 'quinta';

export type TipoRefeicao =
  | 'sem_refeicoes'
  | 'incluido'
  | 'pequeno_almoco'
  | 'meia_pensao'
  | 'pensao_completa'
  | 'almoço'
  | 'jantar';

export interface Localizacao {
  id: number;
  codigo_postal: string;
  nome: string;
  localidade: string;
  municipio?: string;
  distrito?: string;
  morada?: string;
  latitude?: number;
  longitude?: number;
}

export interface TipoAlojamentoData {
  id: number;
  nome: TipoAlojamento;
  descricao?: string;
}

export interface Alojamento {
  id: number;
  nome: string;
  descricao?: string;
  tipo: TipoAlojamento;
  localizacao_id: number;
  localizacao?: Localizacao | null;
  preco_noite: number;
  num_quartos: number;
  num_camas?: number;
  rating?: number;
  telefone?: string;
  email?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface AlojamentoComLocalizacao extends Alojamento {
  localizacao: Localizacao;
}

export interface RefeicaoAlojamento {
  id: number;
  alojamento_id: number;
  tipo_refeicao: TipoRefeicao;
  preco_extra?: number;
  disponivel: boolean;
}

export interface ReservaAlojamento {
  id: number;
  alojamento_id: number;
  user_id: string | null;
  nome_hospede: string;
  email_hospede: string;
  telefone_hospede: string;
  data_entrada: string;
  data_saida: string;
  num_pessoas: number;
  num_quartos: number;
  tipo_refeicao: TipoRefeicao;
  preco_total: number;
  status: 'pendente' | 'confirmada' | 'concluido' | 'cancelada';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface AlojamentoComRefeicoes extends AlojamentoComLocalizacao {
  refeicoes: RefeicaoAlojamento[];
}
