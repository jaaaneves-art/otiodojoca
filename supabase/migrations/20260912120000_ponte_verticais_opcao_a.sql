-- PONTE VERTICAIS — OPÇÃO A (Simples)

CREATE TABLE IF NOT EXISTS public.restaurantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endereco TEXT,
  categoria TEXT,
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

CREATE TABLE IF NOT EXISTS public.alojamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endereco TEXT,
  tipo_alojamento TEXT NOT NULL,
  num_quartos INT,
  preco_noite DECIMAL(10,2),
  telefone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comercios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  endereco TEXT,
  tipo_comercio TEXT NOT NULL,
  horario_abertura TIME,
  horario_fecho TIME,
  telefone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMP DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE public.restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alojamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurantes_select" ON public.restaurantes FOR SELECT USING (true);
CREATE POLICY "alojamentos_select" ON public.alojamentos FOR SELECT USING (true);
CREATE POLICY "comercios_select" ON public.comercios FOR SELECT USING (true);

CREATE POLICY "restaurantes_insert" ON public.restaurantes FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');
CREATE POLICY "alojamentos_insert" ON public.alojamentos FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');
CREATE POLICY "comercios_insert" ON public.comercios FOR INSERT WITH CHECK (auth.jwt() ->> 'email' LIKE '%@otj.pt');
