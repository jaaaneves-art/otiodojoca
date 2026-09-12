-- PONTE VERTICAIS — OPÇÃO A (Tabelas Separadas)
-- Data: 12 Set 2026

-- 1. RESTAURANTES
CREATE TABLE IF NOT EXISTS public.restaurantes (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  name TEXT NOT NULL,
  endereco TEXT,
  distrito TEXT,
  categoria TEXT,  -- Italiana, Portuguesa, Asiática, etc
  horario_abertura TIME,
  horario_fecho TIME,
  telefone TEXT,
  email TEXT,
  website TEXT,
  preco_medio DECIMAL(10,2),
  imagem_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. ALOJAMENTOS
CREATE TABLE IF NOT EXISTS public.alojamentos (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  name TEXT NOT NULL,
  endereco TEXT,
  distrito TEXT,
  tipo_alojamento TEXT NOT NULL,  -- hotel, pousada, quinta, apartamento, etc
  num_quartos INT,
  num_camas INT,
  preco_noite DECIMAL(10,2),
  descricao TEXT,
  amenidades TEXT[],  -- array de strings: wifi, piscina, garagem, etc
  imagem_url TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. COMERCIOS
CREATE TABLE IF NOT EXISTS public.comercios (
  id BIGINT PRIMARY KEY DEFAULT gen_random_bigint(),
  name TEXT NOT NULL,
  endereco TEXT,
  distrito TEXT,
  tipo_comercio TEXT NOT NULL,  -- loja, farmácia, restaurante-light, café, etc
  horario_abertura TIME,
  horario_fecho TIME,
  descricao TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  imagem_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

-- INDICES para performance
CREATE INDEX idx_restaurantes_distrito ON public.restaurantes(distrito);
CREATE INDEX idx_restaurantes_categoria ON public.restaurantes(categoria);
CREATE INDEX idx_alojamentos_distrito ON public.alojamentos(distrito);
CREATE INDEX idx_alojamentos_tipo ON public.alojamentos(tipo_alojamento);
CREATE INDEX idx_comercios_distrito ON public.comercios(distrito);
CREATE INDEX idx_comercios_tipo ON public.comercios(tipo_comercio);

-- RLS POLICIES (básico, pode refatorar depois para padrão Freguesia)
ALTER TABLE public.restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;

-- Policy: qualquer um vê (SELECT)
CREATE POLICY "restaurantes_select_public" ON public.restaurantes
  FOR SELECT USING (true);

CREATE POLICY "alojamentos_select_public" ON public.alojamentos
  FOR SELECT USING (true);

CREATE POLICY "comercios_select_public" ON public.comercios
  FOR SELECT USING (true);

-- Policy: só admin pode inserir/atualizar/deletar (será refatorado semana 1)
CREATE POLICY "restaurantes_admin_only" ON public.restaurantes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');

CREATE POLICY "restaurantes_update_admin" ON public.restaurantes
  FOR UPDATE WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');

CREATE POLICY "alojamentos_admin_only" ON public.alojamentos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');

CREATE POLICY "alojamentos_update_admin" ON public.alojamentos
  FOR UPDATE WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');

CREATE POLICY "comercios_admin_only" ON public.comercios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');

CREATE POLICY "comercios_update_admin" ON public.comercios
  FOR UPDATE WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');
