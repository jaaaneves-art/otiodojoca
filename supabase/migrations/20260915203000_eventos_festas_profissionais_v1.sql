-- Eventos & Festas: fornecedores profissionais, nunca acontecimentos da agenda.
-- Depende de entidades_empresas_transversal_v1 e entidades_diaspora_privacidade_v1.
BEGIN;
CREATE TABLE public.eventos_festas_empresas (
  entidade_id bigint PRIMARY KEY REFERENCES public.entidade_empresas(entidade_id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'rascunho' CHECK (estado IN ('rascunho','pendente','ativo','suspenso')),
  capacidade integer CHECK (capacidade BETWEEN 1 AND 1000000),
  area_servico text CHECK (length(area_servico) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX eventos_festas_empresas_capacidade_idx ON public.eventos_festas_empresas(capacidade) WHERE estado = 'ativo';
CREATE TABLE public.eventos_festas_categorias (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text NOT NULL,
  ativo boolean NOT NULL DEFAULT true
);
CREATE TABLE public.eventos_festas_servicos (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text NOT NULL,
  sinonimos text[] NOT NULL DEFAULT '{}',
  nota text,
  ativo boolean NOT NULL DEFAULT true
);
CREATE TABLE public.eventos_festas_servico_categorias (
  servico_slug text REFERENCES public.eventos_festas_servicos(slug) ON DELETE RESTRICT,
  categoria_slug text REFERENCES public.eventos_festas_categorias(slug) ON DELETE RESTRICT,
  PRIMARY KEY(servico_slug, categoria_slug)
);
CREATE INDEX eventos_festas_servico_categoria_idx ON public.eventos_festas_servico_categorias(categoria_slug, servico_slug);
CREATE TABLE public.eventos_festas_tipos (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nome text NOT NULL,
  grupo_slug text REFERENCES public.eventos_festas_tipos(slug) ON DELETE RESTRICT,
  sinonimos text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  CHECK (grupo_slug IS DISTINCT FROM slug)
);
CREATE TABLE public.eventos_festas_empresa_servicos (
  entidade_id bigint REFERENCES public.eventos_festas_empresas(entidade_id) ON DELETE CASCADE,
  servico_slug text REFERENCES public.eventos_festas_servicos(slug) ON DELETE RESTRICT,
  PRIMARY KEY(entidade_id, servico_slug)
);
CREATE INDEX eventos_festas_empresa_servico_idx ON public.eventos_festas_empresa_servicos(servico_slug, entidade_id);
CREATE TABLE public.eventos_festas_empresa_tipos (
  entidade_id bigint REFERENCES public.eventos_festas_empresas(entidade_id) ON DELETE CASCADE,
  tipo_slug text REFERENCES public.eventos_festas_tipos(slug) ON DELETE RESTRICT,
  PRIMARY KEY(entidade_id, tipo_slug)
);
CREATE INDEX eventos_festas_empresa_tipo_idx ON public.eventos_festas_empresa_tipos(tipo_slug, entidade_id);

INSERT INTO public.eventos_festas_categorias(slug,nome) VALUES
('espacos','Espaços para eventos'),
('catering','Catering e restauração'),
('bolos','Bolos, pastelaria e doces'),
('fotografia','Fotografia'),
('video','Vídeo'),
('musica','Música'),
('animacao','Animação'),
('decoracao','Decoração'),
('flores','Flores'),
('aluguer-material','Aluguer de material'),
('som-iluminacao','Som e iluminação'),
('producao','Palcos e produção'),
('transportes','Transportes'),
('vestuario','Vestuário'),
('beleza','Cabeleireiro, barbearia e maquilhagem'),
('convites-papelaria','Convites e papelaria'),
('lembrancas','Lembranças e presentes'),
('seguranca','Segurança'),
('limpeza','Limpeza'),
('organizacao','Organizadores e wedding planners'),
('cerimonias','Cerimónias'),
('criancas','Festas infantis'),
('alojamento-experiencias','Alojamento e experiências'),
('complementares','Serviços complementares');
INSERT INTO public.eventos_festas_servicos(slug,nome,nota) VALUES
('quintas-para-eventos','Quintas para eventos',NULL),
('saloes-de-festas','Salões de festas',NULL),
('restaurantes-com-eventos','Restaurantes com eventos',NULL),
('hoteis','Hotéis',NULL),
('casas-de-turismo-rural','Casas de turismo rural',NULL),
('espacos-para-casamentos','Espaços para casamentos',NULL),
('espacos-para-aniversarios','Espaços para aniversários',NULL),
('espacos-para-festas-infantis','Espaços para festas infantis',NULL),
('espacos-empresariais','Espaços empresariais',NULL),
('centros-de-congressos','Centros de congressos',NULL),
('auditorios','Auditórios',NULL),
('discotecas','Discotecas',NULL),
('bares','Bares',NULL),
('espacos-ao-ar-livre','Espaços ao ar livre',NULL),
('jardins','Jardins',NULL),
('espacos-junto-a-praia','Espaços junto à praia',NULL),
('tendas','Tendas',NULL),
('espacos-temporarios','Espaços temporários',NULL),
('outros-espacos-para-eventos','Outros espaços para eventos',NULL),
('catering','Catering',NULL),
('restaurantes','Restaurantes',NULL),
('buffets','Buffets',NULL),
('servico-a-mesa','Serviço à mesa',NULL),
('cocktail','Cocktail',NULL),
('coffee-break','Coffee break',NULL),
('brunch','Brunch',NULL),
('churrasco','Churrasco',NULL),
('food-trucks','Food trucks',NULL),
('comida-tradicional','Comida tradicional',NULL),
('cozinha-internacional','Cozinha internacional',NULL),
('catering-empresarial','Catering empresarial',NULL),
('catering-para-casamentos','Catering para casamentos',NULL),
('catering-infantil','Catering infantil',NULL),
('catering-vegetariano','Catering vegetariano',NULL),
('catering-vegan','Catering vegan',NULL),
('outras-especialidades','Outras especialidades',NULL),
('pastelarias','Pastelarias',NULL),
('bolos-de-casamento','Bolos de casamento',NULL),
('bolos-de-aniversario','Bolos de aniversário',NULL),
('bolos-infantis','Bolos infantis',NULL),
('bolos-personalizados','Bolos personalizados',NULL),
('cake-design','Cake design',NULL),
('cupcakes','Cupcakes',NULL),
('doces','Doces',NULL),
('sobremesas','Sobremesas',NULL),
('mesas-de-doces','Mesas de doces',NULL),
('chocolates','Chocolates',NULL),
('lembrancas-comestiveis','Lembranças comestíveis',NULL),
('fotografos','Fotógrafos',NULL),
('fotografia-de-casamento','Fotografia de casamento',NULL),
('fotografia-de-batizado','Fotografia de batizado',NULL),
('fotografia-de-comunhao','Fotografia de comunhão',NULL),
('fotografia-de-aniversario','Fotografia de aniversário',NULL),
('fotografia-infantil','Fotografia infantil',NULL),
('fotografia-empresarial','Fotografia empresarial',NULL),
('fotografia-de-eventos','Fotografia de eventos',NULL),
('sessoes-fotograficas','Sessões fotográficas',NULL),
('photobooth','Photobooth',NULL),
('cabine-fotografica','Cabine fotográfica',NULL),
('impressao-instantanea','Impressão instantânea',NULL),
('videografos','Videógrafos',NULL),
('video-de-casamento','Vídeo de casamento',NULL),
('video-de-eventos','Vídeo de eventos',NULL),
('video-empresarial','Vídeo empresarial',NULL),
('filmagem-multicamara','Filmagem multicâmara',NULL),
('drone','Drone','Quando legalmente aplicável. A presença no catálogo não comprova licenças ou qualificações.'),
('streaming','Streaming',NULL),
('transmissao-em-direto','Transmissão em direto',NULL),
('edicao-de-video','Edição de vídeo',NULL),
('dj','DJ',NULL),
('dj-para-casamentos','DJ para casamentos',NULL),
('dj-para-festas','DJ para festas',NULL),
('dj-infantil','DJ infantil',NULL),
('bandas','Bandas',NULL),
('musica-ao-vivo','Música ao vivo',NULL),
('grupos-musicais','Grupos musicais',NULL),
('cantores','Cantores',NULL),
('musicos','Músicos',NULL),
('musica-tradicional','Música tradicional',NULL),
('grupos-de-baile','Grupos de baile',NULL),
('karaoke','Karaoke',NULL),
('saxofonista','Saxofonista',NULL),
('pianista','Pianista',NULL),
('violinista','Violinista',NULL),
('outros-musicos','Outros músicos',NULL),
('animadores','Animadores',NULL),
('animadores-infantis','Animadores infantis',NULL),
('palhacos','Palhaços',NULL),
('magicos','Mágicos',NULL),
('ilusionistas','Ilusionistas',NULL),
('insuflaveis','Insufláveis',NULL),
('mascotes','Mascotes',NULL),
('pinturas-faciais','Pinturas faciais',NULL),
('modelagem-de-baloes','Modelagem de balões',NULL),
('jogos','Jogos',NULL),
('recreacao','Recreação',NULL),
('personagens-tematicas','Personagens temáticas',NULL),
('espetaculos-infantis','Espetáculos infantis',NULL),
('danca','Dança',NULL),
('performers','Performers',NULL),
('artistas-de-rua','Artistas de rua',NULL),
('fogo-e-performances-especiais','Fogo e performances especiais','Quando legalmente aplicável. A presença no catálogo não comprova licenças ou qualificações.'),
('outros-espetaculos','Outros espetáculos',NULL),
('decoradores','Decoradores',NULL),
('decoracao-de-casamentos','Decoração de casamentos',NULL),
('decoracao-de-festas','Decoração de festas',NULL),
('decoracao-infantil','Decoração infantil',NULL),
('decoracao-tematica','Decoração temática',NULL),
('baloes','Balões',NULL),
('arcos-de-baloes','Arcos de balões',NULL),
('backdrops','Backdrops',NULL),
('cenarios','Cenários',NULL),
('centros-de-mesa','Centros de mesa',NULL),
('decoracao-de-mesas','Decoração de mesas',NULL),
('velas','Velas',NULL),
('iluminacao-decorativa','Iluminação decorativa',NULL),
('letras-luminosas','Letras luminosas',NULL),
('numeros-luminosos','Números luminosos',NULL),
('estruturas-decorativas','Estruturas decorativas',NULL),
('floristas','Floristas',NULL),
('ramos-de-noiva','Ramos de noiva',NULL),
('flores-para-casamento','Flores para casamento',NULL),
('centros-florais','Centros florais',NULL),
('decoracao-floral','Decoração floral',NULL),
('flores-para-cerimonias','Flores para cerimónias',NULL),
('flores-para-festas','Flores para festas',NULL),
('arcos-florais','Arcos florais',NULL),
('boutonnieres','Boutonnieres',NULL),
('coroas-e-outros-arranjos','Coroas e outros arranjos',NULL),
('mesas','Mesas',NULL),
('cadeiras','Cadeiras',NULL),
('sofas','Sofás',NULL),
('louca','Louça',NULL),
('copos','Copos',NULL),
('talheres','Talheres',NULL),
('toalhas','Toalhas',NULL),
('mobiliario','Mobiliário',NULL),
('palcos','Palcos',NULL),
('estruturas','Estruturas',NULL),
('pistas-de-danca','Pistas de dança',NULL),
('geradores','Geradores',NULL),
('aquecedores','Aquecedores',NULL),
('climatizacao','Climatização',NULL),
('casas-de-banho-portateis','Casas de banho portáteis',NULL),
('barreiras','Barreiras',NULL),
('equipamento-para-eventos','Equipamento para eventos',NULL),
('aluguer-de-som','Aluguer de som',NULL),
('sonorizacao','Sonorização',NULL),
('pa','PA',NULL),
('microfones','Microfones',NULL),
('mesas-de-mistura','Mesas de mistura',NULL),
('tecnicos-de-som','Técnicos de som',NULL),
('iluminacao','Iluminação',NULL),
('iluminacao-de-palco','Iluminação de palco',NULL),
('moving-heads','Moving heads',NULL),
('lasers','Lasers','Quando legalmente aplicável. A presença no catálogo não comprova licenças ou qualificações.'),
('ecras','Ecrãs',NULL),
('led-walls','LED walls',NULL),
('projetores','Projetores',NULL),
('audiovisual','Audiovisual',NULL),
('tecnicos-audiovisuais','Técnicos audiovisuais',NULL),
('producao-de-eventos','Produção de eventos',NULL),
('producao-tecnica','Produção técnica',NULL),
('direcao-tecnica','Direção técnica',NULL),
('montagem','Montagem',NULL),
('desmontagem','Desmontagem',NULL),
('backline','Backline',NULL),
('equipamento-tecnico','Equipamento técnico',NULL),
('gestao-tecnica-de-eventos','Gestão técnica de eventos',NULL),
('automoveis-para-casamento','Automóveis para casamento',NULL),
('carros-classicos','Carros clássicos',NULL),
('limusinas','Limusinas',NULL),
('automoveis-de-luxo','Automóveis de luxo',NULL),
('aluguer-com-motorista','Aluguer com motorista',NULL),
('transfers','Transfers',NULL),
('transporte-de-convidados','Transporte de convidados',NULL),
('carrinhas','Carrinhas',NULL),
('minibus','Minibus',NULL),
('autocarros','Autocarros',NULL),
('transporte-executivo','Transporte executivo',NULL),
('vestidos-de-noiva','Vestidos de noiva',NULL),
('fatos','Fatos',NULL),
('vestidos-de-cerimonia','Vestidos de cerimónia',NULL),
('roupa-infantil-de-cerimonia','Roupa infantil de cerimónia',NULL),
('acessorios','Acessórios',NULL),
('sapatos','Sapatos',NULL),
('joalharia','Joalharia',NULL),
('aluguer-de-vestuario','Aluguer de vestuário',NULL),
('trajes-tradicionais','Trajes tradicionais',NULL),
('outros-artigos-de-cerimonia','Outros artigos de cerimónia',NULL),
('cabeleireiros','Cabeleireiros',NULL),
('penteados-de-noiva','Penteados de noiva',NULL),
('penteados-para-cerimonia','Penteados para cerimónia',NULL),
('barbeiros','Barbeiros',NULL),
('maquilhagem','Maquilhagem',NULL),
('maquilhagem-de-noiva','Maquilhagem de noiva',NULL),
('maquilhagem-para-eventos','Maquilhagem para eventos',NULL),
('unhas','Unhas',NULL),
('estetica','Estética',NULL),
('preparacao-de-noivos','Preparação de noivos',NULL),
('servicos-ao-domicilio-e-local-do-evento','Serviços ao domicílio e local do evento',NULL),
('convites','Convites',NULL),
('convites-personalizados','Convites personalizados',NULL),
('convites-digitais','Convites digitais',NULL),
('save-the-date','Save the date',NULL),
('menus','Menus',NULL),
('marcadores-de-mesa','Marcadores de mesa',NULL),
('seating-plans','Seating plans',NULL),
('placards','Placards',NULL),
('impressao','Impressão',NULL),
('design-grafico','Design gráfico',NULL),
('caligrafia','Caligrafia',NULL),
('papelaria-personalizada','Papelaria personalizada',NULL),
('lembrancas-de-casamento','Lembranças de casamento',NULL),
('lembrancas-de-batizado','Lembranças de batizado',NULL),
('lembrancas-de-comunhao','Lembranças de comunhão',NULL),
('lembrancas-de-aniversario','Lembranças de aniversário',NULL),
('brindes','Brindes',NULL),
('presentes-personalizados','Presentes personalizados',NULL),
('gravacao','Gravação',NULL),
('personalizacao','Personalização',NULL),
('merchandising-para-eventos','Merchandising para eventos',NULL),
('seguranca-privada','Segurança privada','Quando legalmente aplicável. A presença no catálogo não comprova licenças ou qualificações.'),
('controlo-de-acessos','Controlo de acessos',NULL),
('vigilancia-de-eventos','Vigilância de eventos',NULL),
('gestao-de-entradas','Gestão de entradas',NULL),
('assistencia-de-recinto','Assistência de recinto',NULL),
('limpeza-antes-do-evento','Limpeza antes do evento',NULL),
('limpeza-durante-o-evento','Limpeza durante o evento',NULL),
('limpeza-apos-evento','Limpeza após evento',NULL),
('equipas-de-limpeza','Equipas de limpeza',NULL),
('recolha-de-residuos','Recolha de resíduos',NULL),
('apoio-logistico','Apoio logístico',NULL),
('wedding-planner','Wedding planner',NULL),
('organizador-de-eventos','Organizador de eventos',NULL),
('planeamento-de-festas','Planeamento de festas',NULL),
('organizacao-de-aniversarios','Organização de aniversários',NULL),
('organizacao-de-festas-infantis','Organização de festas infantis',NULL),
('organizacao-de-eventos-empresariais','Organização de eventos empresariais',NULL),
('coordenacao-no-dia','Coordenação no dia',NULL),
('cerimonial','Cerimonial',NULL),
('producao-integral-de-eventos','Produção integral de eventos',NULL),
('consultoria-de-eventos','Consultoria de eventos',NULL),
('celebrantes','Celebrantes','Quando legalmente aplicável. A presença no catálogo não comprova licenças ou qualificações.'),
('mestres-de-cerimonias','Mestres de cerimónias',NULL),
('apresentadores','Apresentadores',NULL),
('cerimonialistas','Cerimonialistas',NULL),
('coordenacao-de-cerimonia','Coordenação de cerimónia',NULL),
('workshops-infantis','Workshops infantis',NULL),
('espetaculos','Espetáculos',NULL),
('lembrancas','Lembranças',NULL),
('alojamento-de-convidados','Alojamento de convidados',NULL),
('atividades-para-grupos','Atividades para grupos',NULL),
('experiencias-para-grupos','Experiências para grupos',NULL),
('babysitting-durante-eventos','Babysitting durante eventos',NULL),
('apoio-a-criancas','Apoio a crianças',NULL),
('rececionistas','Rececionistas',NULL),
('hospedeiras','Hospedeiras',NULL),
('staff-para-eventos','Staff para eventos',NULL),
('bartenders','Bartenders',NULL),
('cocktail-bar','Cocktail bar',NULL),
('bar-movel','Bar móvel',NULL),
('sommeliers','Sommeliers',NULL),
('coffee-service','Coffee service',NULL),
('valet-parking','Valet parking',NULL),
('guarda-roupa','Guarda-roupa',NULL),
('traducao-e-interpretacao','Tradução e interpretação',NULL),
('guias','Guias',NULL),
('energia','Energia',NULL),
('internet-temporaria','Internet temporária',NULL),
('wi-fi-para-eventos','Wi-Fi para eventos',NULL),
('bilhetica','Bilhética',NULL),
('credenciacao','Credenciação',NULL),
('outros-servicos','Outros serviços',NULL);
UPDATE public.eventos_festas_servicos SET sinonimos = ARRAY['fotógrafo','fotografo'] WHERE slug = 'fotografos';
INSERT INTO public.eventos_festas_servico_categorias VALUES
('quintas-para-eventos','espacos'),
('saloes-de-festas','espacos'),
('restaurantes-com-eventos','espacos'),
('hoteis','espacos'),
('casas-de-turismo-rural','espacos'),
('espacos-para-casamentos','espacos'),
('espacos-para-aniversarios','espacos'),
('espacos-para-festas-infantis','espacos'),
('espacos-empresariais','espacos'),
('centros-de-congressos','espacos'),
('auditorios','espacos'),
('discotecas','espacos'),
('bares','espacos'),
('espacos-ao-ar-livre','espacos'),
('jardins','espacos'),
('espacos-junto-a-praia','espacos'),
('tendas','espacos'),
('espacos-temporarios','espacos'),
('outros-espacos-para-eventos','espacos'),
('catering','catering'),
('restaurantes','catering'),
('buffets','catering'),
('servico-a-mesa','catering'),
('cocktail','catering'),
('coffee-break','catering'),
('brunch','catering'),
('churrasco','catering'),
('food-trucks','catering'),
('comida-tradicional','catering'),
('cozinha-internacional','catering'),
('catering-empresarial','catering'),
('catering-para-casamentos','catering'),
('catering-infantil','catering'),
('catering-vegetariano','catering'),
('catering-vegan','catering'),
('outras-especialidades','catering'),
('pastelarias','bolos'),
('bolos-de-casamento','bolos'),
('bolos-de-aniversario','bolos'),
('bolos-infantis','bolos'),
('bolos-personalizados','bolos'),
('cake-design','bolos'),
('cupcakes','bolos'),
('doces','bolos'),
('sobremesas','bolos'),
('mesas-de-doces','bolos'),
('chocolates','bolos'),
('lembrancas-comestiveis','bolos'),
('fotografos','fotografia'),
('fotografia-de-casamento','fotografia'),
('fotografia-de-batizado','fotografia'),
('fotografia-de-comunhao','fotografia'),
('fotografia-de-aniversario','fotografia'),
('fotografia-infantil','fotografia'),
('fotografia-empresarial','fotografia'),
('fotografia-de-eventos','fotografia'),
('sessoes-fotograficas','fotografia'),
('photobooth','fotografia'),
('cabine-fotografica','fotografia'),
('impressao-instantanea','fotografia'),
('videografos','video'),
('video-de-casamento','video'),
('video-de-eventos','video'),
('video-empresarial','video'),
('filmagem-multicamara','video'),
('drone','video'),
('streaming','video'),
('transmissao-em-direto','video'),
('edicao-de-video','video'),
('dj','musica'),
('dj-para-casamentos','musica'),
('dj-para-festas','musica'),
('dj-infantil','musica'),
('bandas','musica'),
('musica-ao-vivo','musica'),
('grupos-musicais','musica'),
('cantores','musica'),
('musicos','musica'),
('musica-tradicional','musica'),
('grupos-de-baile','musica'),
('karaoke','musica'),
('saxofonista','musica'),
('pianista','musica'),
('violinista','musica'),
('outros-musicos','musica'),
('animadores','animacao'),
('animadores-infantis','animacao'),
('palhacos','animacao'),
('magicos','animacao'),
('ilusionistas','animacao'),
('insuflaveis','animacao'),
('mascotes','animacao'),
('pinturas-faciais','animacao'),
('modelagem-de-baloes','animacao'),
('jogos','animacao'),
('recreacao','animacao'),
('personagens-tematicas','animacao'),
('espetaculos-infantis','animacao'),
('danca','animacao'),
('performers','animacao'),
('artistas-de-rua','animacao'),
('fogo-e-performances-especiais','animacao'),
('outros-espetaculos','animacao'),
('decoradores','decoracao'),
('decoracao-de-casamentos','decoracao'),
('decoracao-de-festas','decoracao'),
('decoracao-infantil','decoracao'),
('decoracao-tematica','decoracao'),
('baloes','decoracao'),
('arcos-de-baloes','decoracao'),
('backdrops','decoracao'),
('cenarios','decoracao'),
('centros-de-mesa','decoracao'),
('decoracao-de-mesas','decoracao'),
('velas','decoracao'),
('iluminacao-decorativa','decoracao'),
('letras-luminosas','decoracao'),
('numeros-luminosos','decoracao'),
('estruturas-decorativas','decoracao'),
('floristas','flores'),
('ramos-de-noiva','flores'),
('flores-para-casamento','flores'),
('centros-florais','flores'),
('decoracao-floral','flores'),
('flores-para-cerimonias','flores'),
('flores-para-festas','flores'),
('arcos-florais','flores'),
('boutonnieres','flores'),
('coroas-e-outros-arranjos','flores'),
('mesas','aluguer-material'),
('cadeiras','aluguer-material'),
('sofas','aluguer-material'),
('louca','aluguer-material'),
('copos','aluguer-material'),
('talheres','aluguer-material'),
('toalhas','aluguer-material'),
('mobiliario','aluguer-material'),
('tendas','aluguer-material'),
('palcos','aluguer-material'),
('estruturas','aluguer-material'),
('pistas-de-danca','aluguer-material'),
('geradores','aluguer-material'),
('aquecedores','aluguer-material'),
('climatizacao','aluguer-material'),
('casas-de-banho-portateis','aluguer-material'),
('barreiras','aluguer-material'),
('equipamento-para-eventos','aluguer-material'),
('aluguer-de-som','som-iluminacao'),
('sonorizacao','som-iluminacao'),
('pa','som-iluminacao'),
('microfones','som-iluminacao'),
('mesas-de-mistura','som-iluminacao'),
('tecnicos-de-som','som-iluminacao'),
('iluminacao','som-iluminacao'),
('iluminacao-de-palco','som-iluminacao'),
('iluminacao-decorativa','som-iluminacao'),
('moving-heads','som-iluminacao'),
('lasers','som-iluminacao'),
('ecras','som-iluminacao'),
('led-walls','som-iluminacao'),
('projetores','som-iluminacao'),
('audiovisual','som-iluminacao'),
('tecnicos-audiovisuais','som-iluminacao'),
('palcos','producao'),
('estruturas','producao'),
('producao-de-eventos','producao'),
('producao-tecnica','producao'),
('direcao-tecnica','producao'),
('montagem','producao'),
('desmontagem','producao'),
('backline','producao'),
('geradores','producao'),
('equipamento-tecnico','producao'),
('gestao-tecnica-de-eventos','producao'),
('automoveis-para-casamento','transportes'),
('carros-classicos','transportes'),
('limusinas','transportes'),
('automoveis-de-luxo','transportes'),
('aluguer-com-motorista','transportes'),
('transfers','transportes'),
('transporte-de-convidados','transportes'),
('carrinhas','transportes'),
('minibus','transportes'),
('autocarros','transportes'),
('transporte-executivo','transportes'),
('vestidos-de-noiva','vestuario'),
('fatos','vestuario'),
('vestidos-de-cerimonia','vestuario'),
('roupa-infantil-de-cerimonia','vestuario'),
('acessorios','vestuario'),
('sapatos','vestuario'),
('joalharia','vestuario'),
('aluguer-de-vestuario','vestuario'),
('trajes-tradicionais','vestuario'),
('outros-artigos-de-cerimonia','vestuario'),
('cabeleireiros','beleza'),
('penteados-de-noiva','beleza'),
('penteados-para-cerimonia','beleza'),
('barbeiros','beleza'),
('maquilhagem','beleza'),
('maquilhagem-de-noiva','beleza'),
('maquilhagem-para-eventos','beleza'),
('unhas','beleza'),
('estetica','beleza'),
('preparacao-de-noivos','beleza'),
('servicos-ao-domicilio-e-local-do-evento','beleza'),
('convites','convites-papelaria'),
('convites-personalizados','convites-papelaria'),
('convites-digitais','convites-papelaria'),
('save-the-date','convites-papelaria'),
('menus','convites-papelaria'),
('marcadores-de-mesa','convites-papelaria'),
('seating-plans','convites-papelaria'),
('placards','convites-papelaria'),
('impressao','convites-papelaria'),
('design-grafico','convites-papelaria'),
('caligrafia','convites-papelaria'),
('papelaria-personalizada','convites-papelaria'),
('lembrancas-de-casamento','lembrancas'),
('lembrancas-de-batizado','lembrancas'),
('lembrancas-de-comunhao','lembrancas'),
('lembrancas-de-aniversario','lembrancas'),
('brindes','lembrancas'),
('presentes-personalizados','lembrancas'),
('gravacao','lembrancas'),
('personalizacao','lembrancas'),
('merchandising-para-eventos','lembrancas'),
('seguranca-privada','seguranca'),
('controlo-de-acessos','seguranca'),
('vigilancia-de-eventos','seguranca'),
('gestao-de-entradas','seguranca'),
('assistencia-de-recinto','seguranca'),
('limpeza-antes-do-evento','limpeza'),
('limpeza-durante-o-evento','limpeza'),
('limpeza-apos-evento','limpeza'),
('equipas-de-limpeza','limpeza'),
('recolha-de-residuos','limpeza'),
('apoio-logistico','limpeza'),
('wedding-planner','organizacao'),
('organizador-de-eventos','organizacao'),
('planeamento-de-festas','organizacao'),
('organizacao-de-aniversarios','organizacao'),
('organizacao-de-festas-infantis','organizacao'),
('organizacao-de-eventos-empresariais','organizacao'),
('coordenacao-no-dia','organizacao'),
('cerimonial','organizacao'),
('producao-integral-de-eventos','organizacao'),
('consultoria-de-eventos','organizacao'),
('celebrantes','cerimonias'),
('mestres-de-cerimonias','cerimonias'),
('apresentadores','cerimonias'),
('cerimonialistas','cerimonias'),
('coordenacao-de-cerimonia','cerimonias'),
('animadores','criancas'),
('animadores-infantis','criancas'),
('palhacos','criancas'),
('magicos','criancas'),
('insuflaveis','criancas'),
('mascotes','criancas'),
('pinturas-faciais','criancas'),
('baloes','criancas'),
('jogos','criancas'),
('workshops-infantis','criancas'),
('espetaculos','criancas'),
('decoracao-infantil','criancas'),
('bolos-infantis','criancas'),
('catering-infantil','criancas'),
('espacos-para-festas-infantis','criancas'),
('fotografia-infantil','criancas'),
('lembrancas','criancas'),
('alojamento-de-convidados','alojamento-experiencias'),
('hoteis','alojamento-experiencias'),
('casas-de-turismo-rural','alojamento-experiencias'),
('atividades-para-grupos','alojamento-experiencias'),
('experiencias-para-grupos','alojamento-experiencias'),
('babysitting-durante-eventos','complementares'),
('apoio-a-criancas','complementares'),
('rececionistas','complementares'),
('hospedeiras','complementares'),
('staff-para-eventos','complementares'),
('bartenders','complementares'),
('cocktail-bar','complementares'),
('bar-movel','complementares'),
('sommeliers','complementares'),
('coffee-service','complementares'),
('valet-parking','complementares'),
('guarda-roupa','complementares'),
('traducao-e-interpretacao','complementares'),
('guias','complementares'),
('apoio-logistico','complementares'),
('geradores','complementares'),
('energia','complementares'),
('internet-temporaria','complementares'),
('wi-fi-para-eventos','complementares'),
('streaming','complementares'),
('bilhetica','complementares'),
('credenciacao','complementares'),
('outros-servicos','complementares');
INSERT INTO public.eventos_festas_tipos(slug,nome) VALUES
('casamentos','Casamentos'),
('aniversarios','Aniversários'),
('despedidas','Despedidas'),
('festas-infantis','Festas infantis'),
('familia','Família'),
('eventos-empresariais','Eventos empresariais'),
('festas-populares','Festas populares e públicas'),
('outros','Outros');
INSERT INTO public.eventos_festas_tipos(slug,nome,grupo_slug) VALUES
('casamento-civil','Casamento civil','casamentos'),
('casamento-religioso','Casamento religioso','casamentos'),
('casamento-ao-ar-livre','Casamento ao ar livre','casamentos'),
('copo-dagua','Copo-d’água','casamentos'),
('festa-de-casamento','Festa de casamento','casamentos'),
('renovacao-de-votos','Renovação de votos','casamentos'),
('pedido-de-casamento','Pedido de casamento','casamentos'),
('noivado','Noivado','casamentos'),
('aniversario-adulto','Aniversário adulto','aniversarios'),
('aniversario-infantil','Aniversário infantil','aniversarios'),
('festa-surpresa','Festa surpresa','aniversarios'),
('aniversarios-especiais','Aniversários especiais','aniversarios'),
('despedida-de-solteiro','Despedida de solteiro','despedidas'),
('despedida-de-solteira','Despedida de solteira','despedidas'),
('despedida-conjunta','Despedida conjunta','despedidas'),
('festa-de-divorcio-e-separacao','Festa de divórcio e separação','despedidas'),
('festa-infantil','Festa infantil','festas-infantis'),
('batizado','Batizado','festas-infantis'),
('comunhao','Comunhão','festas-infantis'),
('crisma','Crisma','festas-infantis'),
('festa-escolar','Festa escolar','festas-infantis'),
('festa-tematica','Festa temática','festas-infantis'),
('festa-de-nascimento','Festa de nascimento','festas-infantis'),
('baby-shower','Baby shower','festas-infantis'),
('revelacao-do-sexo-do-bebe','Revelação do sexo do bebé','festas-infantis'),
('reuniao-familiar','Reunião familiar','familia'),
('bodas','Bodas','familia'),
('celebracoes-familiares','Celebrações familiares','familia'),
('almoco-e-jantar-familiar','Almoço e jantar familiar','familia'),
('festa-privada','Festa privada','familia'),
('evento-empresarial','Evento empresarial','eventos-empresariais'),
('jantar-de-empresa','Jantar de empresa','eventos-empresariais'),
('festa-de-natal','Festa de Natal','eventos-empresariais'),
('team-building','Team building','eventos-empresariais'),
('congresso','Congresso','eventos-empresariais'),
('conferencia','Conferência','eventos-empresariais'),
('seminario','Seminário','eventos-empresariais'),
('workshop','Workshop','eventos-empresariais'),
('apresentacao-de-produto','Apresentação de produto','eventos-empresariais'),
('inauguracao','Inauguração','eventos-empresariais'),
('evento-promocional','Evento promocional','eventos-empresariais'),
('feira-profissional','Feira profissional','eventos-empresariais'),
('convencao','Convenção','eventos-empresariais'),
('baile','Baile','festas-populares'),
('romaria','Romaria','festas-populares'),
('festa-popular','Festa popular','festas-populares'),
('festival','Festival','festas-populares'),
('feira','Feira','festas-populares'),
('arraial','Arraial','festas-populares'),
('evento-cultural','Evento cultural','festas-populares'),
('evento-comunitario','Evento comunitário','festas-populares');
UPDATE public.eventos_festas_tipos SET sinonimos = ARRAY['despedida de casado','festa de divórcio','separação'] WHERE slug = 'festa-de-divorcio-e-separacao';
UPDATE public.eventos_festas_tipos SET sinonimos = ARRAY['18 anos','25 anos','30 anos','40 anos','50 anos','60 anos'] WHERE slug = 'aniversarios-especiais';

CREATE FUNCTION public.eventos_festas_pode_gerir(p_entidade_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.entidade_responsaveis
 WHERE entidade_id = p_entidade_id AND profile_id = auth.uid() AND estado = 'ativo'
 AND papel IN ('proprietario','administrador','gestor'));
$$;
CREATE FUNCTION public.eventos_festas_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
CREATE FUNCTION public.eventos_festas_visivel(p_entidade_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT EXISTS (SELECT 1 FROM public.eventos_festas_empresas ef JOIN public.entidades e ON e.id = ef.entidade_id
 WHERE e.id = p_entidade_id AND e.estado = 'publicado' AND ef.estado = 'ativo');
$$;

ALTER TABLE public.eventos_festas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_empresa_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_empresa_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_servico_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_festas_tipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY eventos_festas_empresas_read ON public.eventos_festas_empresas FOR SELECT USING
 (public.eventos_festas_visivel(entidade_id) OR public.eventos_festas_pode_gerir(entidade_id) OR public.eventos_festas_admin());
CREATE POLICY eventos_festas_empresa_servicos_read ON public.eventos_festas_empresa_servicos FOR SELECT USING
 (public.eventos_festas_visivel(entidade_id) OR public.eventos_festas_pode_gerir(entidade_id) OR public.eventos_festas_admin());
CREATE POLICY eventos_festas_empresa_tipos_read ON public.eventos_festas_empresa_tipos FOR SELECT USING
 (public.eventos_festas_visivel(entidade_id) OR public.eventos_festas_pode_gerir(entidade_id) OR public.eventos_festas_admin());
CREATE POLICY eventos_festas_categorias_read ON public.eventos_festas_categorias FOR SELECT USING (ativo);
CREATE POLICY eventos_festas_servicos_read ON public.eventos_festas_servicos FOR SELECT USING (ativo);
CREATE POLICY eventos_festas_tipos_read ON public.eventos_festas_tipos FOR SELECT USING (ativo);
CREATE POLICY eventos_festas_servico_categorias_read ON public.eventos_festas_servico_categorias FOR SELECT USING (
 EXISTS (SELECT 1 FROM public.eventos_festas_servicos s WHERE s.slug = servico_slug AND s.ativo)
 AND EXISTS (SELECT 1 FROM public.eventos_festas_categorias c WHERE c.slug = categoria_slug AND c.ativo));
-- Escrita apenas nas RPC autenticadas e atómicas abaixo. Sem políticas permissivas de escrita.
REVOKE ALL ON public.eventos_festas_empresas, public.eventos_festas_empresa_servicos,
 public.eventos_festas_empresa_tipos, public.eventos_festas_categorias, public.eventos_festas_servicos,
 public.eventos_festas_servico_categorias, public.eventos_festas_tipos FROM anon, authenticated;
GRANT SELECT ON public.eventos_festas_empresas, public.eventos_festas_empresa_servicos,
 public.eventos_festas_empresa_tipos, public.eventos_festas_categorias, public.eventos_festas_servicos,
 public.eventos_festas_servico_categorias, public.eventos_festas_tipos TO anon, authenticated;
GRANT ALL ON public.eventos_festas_empresas, public.eventos_festas_empresa_servicos,
 public.eventos_festas_empresa_tipos, public.eventos_festas_categorias, public.eventos_festas_servicos,
 public.eventos_festas_servico_categorias, public.eventos_festas_tipos TO service_role;

-- Contrato público explícito: a view é deliberadamente do proprietário, com filtro
-- de publicação obrigatório. Não inclui perfis, responsáveis, NIF ou dados administrativos.
CREATE VIEW public.eventos_festas_diretorio WITH (security_barrier = true) AS
SELECT e.slug, e.nome, e.descricao, e.fotografias, e.telefone, e.email, e.website, e.redes_sociais,
 ee.pais_codigo, e.regiao, coalesce(e.localidade, l.localidade, f.localidade) AS localidade,
 e.lugar, e.freguesia_id, f.nome AS freguesia, coalesce(f.municipio,l.municipio) AS concelho,
 l.distrito, ee.verificada, ef.capacidade, ef.area_servico,
 coalesce((SELECT jsonb_agg(jsonb_build_object('slug',s.slug,'nome',s.nome,'nota',s.nota,'sinonimos',s.sinonimos) ORDER BY s.nome)
 FROM public.eventos_festas_empresa_servicos es JOIN public.eventos_festas_servicos s ON s.slug = es.servico_slug
 WHERE es.entidade_id = e.id AND s.ativo), '[]'::jsonb) AS servicos,
 coalesce((SELECT jsonb_agg(jsonb_build_object('slug',t.slug,'nome',t.nome,'grupo_slug',t.grupo_slug,'sinonimos',t.sinonimos) ORDER BY t.nome)
 FROM public.eventos_festas_empresa_tipos et JOIN public.eventos_festas_tipos t ON t.slug = et.tipo_slug
 WHERE et.entidade_id = e.id AND t.ativo), '[]'::jsonb) AS tipos,
 coalesce((SELECT array_agg(DISTINCT sc.categoria_slug)
 FROM public.eventos_festas_empresa_servicos es JOIN public.eventos_festas_servicos s ON s.slug = es.servico_slug
 JOIN public.eventos_festas_servico_categorias sc ON sc.servico_slug = s.slug
 JOIN public.eventos_festas_categorias c ON c.slug = sc.categoria_slug
 WHERE es.entidade_id = e.id AND s.ativo AND c.ativo),'{}'::text[]) AS categorias
FROM public.eventos_festas_empresas ef JOIN public.entidades e ON e.id = ef.entidade_id
JOIN public.entidade_empresas ee ON ee.entidade_id = e.id
LEFT JOIN public.freguesias f ON f.id = e.freguesia_id
LEFT JOIN public.localizacoes l ON l.id = e.localizacao_id
WHERE ef.estado = 'ativo' AND e.estado = 'publicado';
GRANT SELECT ON public.eventos_festas_diretorio TO anon, authenticated;

CREATE FUNCTION public.eventos_festas_normalizar(p_texto text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, pg_temp AS $$
 SELECT translate(lower(coalesce(p_texto,'')), 'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc');
$$;
CREATE FUNCTION public.eventos_festas_pesquisar(
 p_texto text DEFAULT '', p_servico text DEFAULT '', p_tipo text DEFAULT '', p_categoria text DEFAULT '',
 p_local text DEFAULT '', p_pais text DEFAULT '', p_capacidade integer DEFAULT NULL,
 p_pagina integer DEFAULT 1
) RETURNS SETOF public.eventos_festas_diretorio LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public, pg_temp AS $$
 SELECT d.* FROM public.eventos_festas_diretorio d
 WHERE (coalesce(p_servico,'') = '' OR d.servicos @> jsonb_build_array(jsonb_build_object('slug',p_servico)))
 AND (coalesce(p_tipo,'') = '' OR d.tipos @> jsonb_build_array(jsonb_build_object('slug',p_tipo))
   OR d.tipos @> jsonb_build_array(jsonb_build_object('grupo_slug',p_tipo)))
 AND (coalesce(p_categoria,'') = '' OR p_categoria = ANY(d.categorias))
 AND (coalesce(p_pais,'') = '' OR d.pais_codigo = upper(p_pais))
 AND (p_capacidade IS NULL OR d.capacidade >= p_capacidade)
 AND (coalesce(p_local,'') = '' OR position(public.eventos_festas_normalizar(p_local) in
   public.eventos_festas_normalizar(concat_ws(' ', d.localidade,d.regiao,d.freguesia,d.concelho,d.distrito,d.lugar,d.area_servico))) > 0)
 AND (coalesce(p_texto,'') = '' OR to_tsvector('portuguese',public.eventos_festas_normalizar(concat_ws(' ',d.nome,d.descricao,d.servicos::text,d.tipos::text)))
   @@ websearch_to_tsquery('portuguese',public.eventos_festas_normalizar(p_texto)))
 ORDER BY d.nome, d.slug LIMIT 24 OFFSET (greatest(1,least(coalesce(p_pagina,1),10000))-1)*24;
$$;

-- Gestão só devolve entidades geridas, incluindo as que ainda não ativaram este módulo.
CREATE FUNCTION public.eventos_festas_minhas_empresas()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object(
 'id',e.id,'slug',e.slug,'nome',e.nome,'descricao',e.descricao,'fotografias',e.fotografias,
 'telefone',e.telefone,'email',e.email,'website',e.website,'redes_sociais',e.redes_sociais,
 'freguesia_id',e.freguesia_id,'regiao',e.regiao,'localidade',e.localidade,'lugar',e.lugar,
 'pais_codigo',coalesce(ee.pais_codigo,'PT'),'verificada',coalesce(ee.verificada,false),
 'estado_entidade',e.estado,'estado',ef.estado,'capacidade',ef.capacidade,'area_servico',ef.area_servico,
 'servicos',coalesce((SELECT jsonb_agg(servico_slug) FROM public.eventos_festas_empresa_servicos WHERE entidade_id=e.id),'[]'::jsonb),
 'tipos',coalesce((SELECT jsonb_agg(tipo_slug) FROM public.eventos_festas_empresa_tipos WHERE entidade_id=e.id),'[]'::jsonb)
 ) ORDER BY e.nome),'[]'::jsonb)
 FROM public.entidades e LEFT JOIN public.entidade_empresas ee ON ee.entidade_id=e.id
 LEFT JOIN public.eventos_festas_empresas ef ON ef.entidade_id=e.id
 WHERE public.eventos_festas_pode_gerir(e.id);
$$;

-- Criação/adesão/edição na mesma transação. Não aceita owner/profile/verificada/estado do browser.
CREATE FUNCTION public.eventos_festas_guardar(
 p_entidade_id bigint, p_dados jsonb, p_servicos text[], p_tipos text[], p_submeter boolean DEFAULT true
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
 v_id bigint := p_entidade_id; v_estado text; v_categoria bigint; v_pais text;
 v_freguesia bigint; v_capacidade integer; v_fotos text[]; v_redes jsonb;
 v_nome text := btrim(p_dados->>'nome'); v_localidade text := btrim(p_dados->>'localidade');
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE='42501'; END IF;
 IF p_dados IS NULL OR jsonb_typeof(p_dados) <> 'object' OR v_nome IS NULL OR length(v_nome) NOT BETWEEN 2 AND 200
 OR length(coalesce(p_dados->>'descricao','')) > 10000
 OR length(coalesce(p_dados->>'area_servico','')) > 1000
 OR length(coalesce(p_dados->>'regiao','')) > 200 OR length(coalesce(v_localidade,'')) > 200
 OR length(coalesce(p_dados->>'lugar','')) > 500 OR length(coalesce(p_dados->>'telefone','')) > 80
 THEN RAISE EXCEPTION 'Dados de perfil inválidos' USING ERRCODE='22023'; END IF;
 v_pais := upper(btrim(coalesce(p_dados->>'pais_codigo','PT')));
 IF v_pais !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'Indique o código de país com duas letras' USING ERRCODE='22023'; END IF;
 v_freguesia := nullif(p_dados->>'freguesia_id','')::bigint;
 IF v_pais <> 'PT' AND (v_freguesia IS NOT NULL OR coalesce(v_localidade,'') = '') THEN
 RAISE EXCEPTION 'No estrangeiro indique a localidade e deixe a freguesia portuguesa vazia' USING ERRCODE='22023'; END IF;
 IF v_freguesia IS NULL AND coalesce(v_localidade,'') = '' THEN
 RAISE EXCEPTION 'Indique uma freguesia ou localidade' USING ERRCODE='22023'; END IF;
 v_capacidade := nullif(p_dados->>'capacidade','')::integer;
 IF v_capacidade IS NOT NULL AND v_capacidade NOT BETWEEN 1 AND 1000000 THEN RAISE EXCEPTION 'Capacidade inválida' USING ERRCODE='22023'; END IF;
 IF coalesce(p_dados->>'website','') <> '' AND (length(p_dados->>'website') > 2000 OR p_dados->>'website' !~ '^https?://[^[:space:]]+$')
 THEN RAISE EXCEPTION 'Website inválido' USING ERRCODE='22023'; END IF;
 IF coalesce(p_dados->>'email','') <> '' AND (length(p_dados->>'email') > 254 OR p_dados->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
 THEN RAISE EXCEPTION 'Email público inválido' USING ERRCODE='22023'; END IF;
 v_fotos := ARRAY(SELECT jsonb_array_elements_text(coalesce(p_dados->'fotografias','[]'::jsonb)));
 IF cardinality(v_fotos)>12 OR EXISTS(SELECT 1 FROM unnest(v_fotos) u WHERE length(u)>2000 OR u !~ '^https://[^[:space:]]+$')
 THEN RAISE EXCEPTION 'Use até 12 imagens com URL HTTPS' USING ERRCODE='22023'; END IF;
 v_redes := coalesce(p_dados->'redes_sociais','{}'::jsonb);
 IF jsonb_typeof(v_redes)<>'object' OR length(v_redes::text)>6000 OR EXISTS(
 SELECT 1 FROM jsonb_each_text(v_redes) r WHERE r.key NOT IN ('instagram','facebook','linkedin') OR r.value !~ '^https://[^[:space:]]+$')
 THEN RAISE EXCEPTION 'Redes sociais inválidas' USING ERRCODE='22023'; END IF;
 IF p_servicos IS NULL OR p_tipos IS NULL OR cardinality(p_servicos) NOT BETWEEN 1 AND 80 OR cardinality(p_tipos) NOT BETWEEN 1 AND 60
 OR EXISTS(SELECT 1 FROM unnest(p_servicos) u WHERE NOT EXISTS(SELECT 1 FROM public.eventos_festas_servicos s WHERE s.slug=u AND s.ativo))
 OR EXISTS(SELECT 1 FROM unnest(p_tipos) u WHERE NOT EXISTS(SELECT 1 FROM public.eventos_festas_tipos t WHERE t.slug=u AND t.ativo))
 THEN RAISE EXCEPTION 'Escolha serviços e tipos de evento válidos' USING ERRCODE='22023'; END IF;
 IF v_id IS NOT NULL THEN
   -- Serializa alterações ao perfil partilhado e valida responsabilidade no servidor.
   PERFORM 1 FROM public.entidades WHERE id=v_id FOR UPDATE;
   IF NOT public.eventos_festas_pode_gerir(v_id) THEN RAISE EXCEPTION 'Sem autorização para gerir esta entidade' USING ERRCODE='42501'; END IF;
   SELECT estado INTO v_estado FROM public.eventos_festas_empresas WHERE entidade_id=v_id;
   IF v_estado='suspenso' THEN RAISE EXCEPTION 'Presença suspensa: contacte a equipa OTJ' USING ERRCODE='42501'; END IF;
 ELSE
   -- Evita criação repetida concorrente com o mesmo nome/país/localidade.
   PERFORM pg_advisory_xact_lock(hashtextextended(public.eventos_festas_normalizar(v_nome)||v_pais||public.eventos_festas_normalizar(v_localidade),0));
   IF EXISTS(SELECT 1 FROM public.entidades e LEFT JOIN public.entidade_empresas ee ON ee.entidade_id=e.id
     WHERE public.eventos_festas_normalizar(e.nome)=public.eventos_festas_normalizar(v_nome)
     AND coalesce(ee.pais_codigo,'PT')=v_pais
     AND (public.eventos_festas_normalizar(e.localidade)=public.eventos_festas_normalizar(v_localidade)
       OR (v_freguesia IS NOT NULL AND e.freguesia_id=v_freguesia))) THEN
     RAISE EXCEPTION 'Já existe uma entidade semelhante. Escolha a entidade gerida ou peça acesso à existente.' USING ERRCODE='23505';
   END IF;
   SELECT id INTO v_categoria FROM public.categorias_entidade WHERE slug='eventos-festas';
   INSERT INTO public.entidades(nome,slug,categoria_id,freguesia_id,estado)
   VALUES(v_nome,'empresa-'||gen_random_uuid()::text,v_categoria,v_freguesia,'pendente') RETURNING id INTO v_id;
   -- Slug imutável após criação: nome legível e sufixo sem colisão.
   UPDATE public.entidades SET slug=trim(both '-' FROM regexp_replace(public.eventos_festas_normalizar(v_nome),'[^a-z0-9]+','-','g'))||'-'||v_id WHERE id=v_id;
   INSERT INTO public.entidade_responsaveis(entidade_id,profile_id,papel,principal,criado_por)
   VALUES(v_id,auth.uid(),'proprietario',true,auth.uid());
 END IF;
 IF EXISTS(SELECT 1 FROM public.entidades e JOIN public.entidade_empresas ee ON ee.entidade_id=e.id
   WHERE e.id=v_id AND (e.nome IS DISTINCT FROM v_nome OR ee.pais_codigo IS DISTINCT FROM v_pais)) THEN
   UPDATE public.entidade_empresas SET verificada=false,updated_at=now() WHERE entidade_id=v_id;
 END IF;
 UPDATE public.entidades SET nome=v_nome, descricao=nullif(btrim(p_dados->>'descricao'),''),
 telefone=nullif(btrim(p_dados->>'telefone'),''), email=nullif(btrim(p_dados->>'email'),''), website=nullif(btrim(p_dados->>'website'),''),
 fotografias=v_fotos, redes_sociais=v_redes, freguesia_id=v_freguesia,
 -- Uma localização postal portuguesa antiga não acompanha a mudança para outro país.
 localizacao_id=CASE WHEN v_pais<>'PT' THEN NULL ELSE localizacao_id END,
 regiao=nullif(btrim(p_dados->>'regiao'),''), localidade=nullif(v_localidade,''), lugar=nullif(btrim(p_dados->>'lugar'),''), updated_at=now()
 WHERE id=v_id;
 INSERT INTO public.entidade_empresas(entidade_id,pais_codigo) VALUES(v_id,v_pais)
 ON CONFLICT(entidade_id) DO UPDATE SET pais_codigo=excluded.pais_codigo, updated_at=now();
 INSERT INTO public.eventos_festas_empresas(entidade_id,estado,capacidade,area_servico)
 VALUES(v_id,CASE WHEN p_submeter THEN CASE WHEN v_estado='ativo' THEN 'ativo' ELSE 'pendente' END ELSE 'rascunho' END,v_capacidade,nullif(btrim(p_dados->>'area_servico'),''))
 ON CONFLICT(entidade_id) DO UPDATE SET estado=excluded.estado,capacidade=excluded.capacidade,area_servico=excluded.area_servico,updated_at=now();
 -- Substituição apenas das seleções da presença, a pedido do responsável; nunca apaga identidade/conteúdos.
 DELETE FROM public.eventos_festas_empresa_servicos WHERE entidade_id=v_id AND NOT(servico_slug=ANY(p_servicos));
 INSERT INTO public.eventos_festas_empresa_servicos SELECT v_id,u FROM (SELECT DISTINCT unnest(p_servicos) u) s ON CONFLICT DO NOTHING;
 DELETE FROM public.eventos_festas_empresa_tipos WHERE entidade_id=v_id AND NOT(tipo_slug=ANY(p_tipos));
 INSERT INTO public.eventos_festas_empresa_tipos SELECT v_id,u FROM (SELECT DISTINCT unnest(p_tipos) u) t ON CONFLICT DO NOTHING;
 RETURN v_id;
END;
$$;
INSERT INTO public.categorias_entidade(nome,slug,descricao)
VALUES('Eventos & Festas','eventos-festas','Empresas e profissionais para organizar eventos e festas') ON CONFLICT(slug) DO NOTHING;

-- Reivindicar usa o circuito de pedidos existente e nunca concede responsabilidade automaticamente.
CREATE FUNCTION public.eventos_festas_pedir_acesso(p_slug text, p_mensagem text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_entidade public.entidades%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_entidade FROM public.entidades WHERE slug=p_slug AND estado='publicado';
 IF v_entidade.id IS NULL OR length(btrim(coalesce(p_mensagem,''))) NOT BETWEEN 10 AND 2000 THEN
 RAISE EXCEPTION 'Escolha uma entidade publicada e explique a sua ligação' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||v_entidade.id,0));
 IF EXISTS(SELECT 1 FROM public.entidade_pedidos WHERE entidade_id=v_entidade.id AND profile_id=auth.uid() AND estado='pendente') THEN RETURN; END IF;
 INSERT INTO public.entidade_pedidos(entidade_id,profile_id,nome_entidade,tipo_entidade,codigo_atividade,mensagem)
 VALUES(v_entidade.id,auth.uid(),v_entidade.nome,'outro','eventos-festas',btrim(p_mensagem));
END;
$$;

CREATE FUNCTION public.eventos_festas_moderar(p_entidade_id bigint, p_estado text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
 IF NOT public.eventos_festas_admin() THEN RAISE EXCEPTION 'Acesso reservado à administração' USING ERRCODE='42501'; END IF;
 IF p_estado NOT IN ('ativo','suspenso') OR p_estado IS NULL THEN RAISE EXCEPTION 'Estado inválido' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.entidades WHERE id=p_entidade_id FOR UPDATE;
 IF p_estado='ativo' AND NOT EXISTS(SELECT 1 FROM public.entidades WHERE id=p_entidade_id AND estado IN ('pendente','publicado','validado'))
 THEN RAISE EXCEPTION 'Rever primeiro o estado transversal da entidade' USING ERRCODE='22023'; END IF;
 UPDATE public.eventos_festas_empresas SET estado=p_estado,updated_at=now() WHERE entidade_id=p_entidade_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Presença inexistente' USING ERRCODE='22023'; END IF;
 IF p_estado='ativo' THEN UPDATE public.entidades SET estado='publicado',updated_at=now() WHERE id=p_entidade_id; END IF;
END;
$$;
CREATE FUNCTION public.eventos_festas_resolver_acesso(p_pedido_id bigint, p_aprovar boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_pedido public.entidade_pedidos%ROWTYPE;
BEGIN
 IF NOT public.eventos_festas_admin() THEN RAISE EXCEPTION 'Acesso reservado à administração' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_pedido FROM public.entidade_pedidos WHERE id=p_pedido_id AND estado='pendente' AND codigo_atividade='eventos-festas' FOR UPDATE;
 IF v_pedido.id IS NULL OR v_pedido.entidade_id IS NULL OR v_pedido.profile_id IS NULL THEN RAISE EXCEPTION 'Pedido indisponível' USING ERRCODE='22023'; END IF;
 IF p_aprovar THEN
   INSERT INTO public.entidade_responsaveis(entidade_id,profile_id,papel,criado_por)
   VALUES(v_pedido.entidade_id,v_pedido.profile_id,'gestor',auth.uid())
   ON CONFLICT(entidade_id,profile_id) DO UPDATE SET estado='ativo',
     papel=CASE WHEN entidade_responsaveis.papel='colaborador' THEN 'gestor' ELSE entidade_responsaveis.papel END,updated_at=now();
 END IF;
 UPDATE public.entidade_pedidos SET estado=CASE WHEN p_aprovar THEN 'aprovado' ELSE 'rejeitado' END,resolvido_por=auth.uid(),resolvido_em=now() WHERE id=p_pedido_id;
END;
$$;
CREATE FUNCTION public.eventos_festas_moderacao()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
 IF NOT public.eventos_festas_admin() THEN RAISE EXCEPTION 'Acesso reservado à administração' USING ERRCODE='42501'; END IF;
 RETURN jsonb_build_object(
 'empresas',coalesce((SELECT jsonb_agg(jsonb_build_object('id',e.id,'nome',e.nome,'slug',e.slug,'descricao',e.descricao,'estado',ef.estado,'pais_codigo',ee.pais_codigo,'localidade',e.localidade))
 FROM public.eventos_festas_empresas ef JOIN public.entidades e ON e.id=ef.entidade_id JOIN public.entidade_empresas ee ON ee.entidade_id=e.id WHERE ef.estado IN ('pendente','ativo','suspenso')),'[]'::jsonb),
 'pedidos',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'nome',nome_entidade,'mensagem',mensagem,'profile_id',profile_id)) FROM public.entidade_pedidos WHERE estado='pendente' AND codigo_atividade='eventos-festas'),'[]'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.eventos_festas_pode_gerir(bigint), public.eventos_festas_admin(), public.eventos_festas_visivel(bigint),
 public.eventos_festas_normalizar(text), public.eventos_festas_pesquisar(text,text,text,text,text,text,integer,integer),
 public.eventos_festas_minhas_empresas(), public.eventos_festas_guardar(bigint,jsonb,text[],text[],boolean),
 public.eventos_festas_pedir_acesso(text,text), public.eventos_festas_moderar(bigint,text),
 public.eventos_festas_resolver_acesso(bigint,boolean), public.eventos_festas_moderacao() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eventos_festas_pode_gerir(bigint), public.eventos_festas_admin(), public.eventos_festas_visivel(bigint),
 public.eventos_festas_normalizar(text), public.eventos_festas_pesquisar(text,text,text,text,text,text,integer,integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.eventos_festas_minhas_empresas(), public.eventos_festas_guardar(bigint,jsonb,text[],text[],boolean),
 public.eventos_festas_pedir_acesso(text,text), public.eventos_festas_moderar(bigint,text),
 public.eventos_festas_resolver_acesso(bigint,boolean), public.eventos_festas_moderacao() TO authenticated;
COMMENT ON TABLE public.eventos_festas_empresas IS 'Presença profissional de uma entidade. Não representa um evento concreto nem substitui eventos/calendar_events.';
COMMENT ON COLUMN public.eventos_festas_empresas.area_servico IS 'Cobertura declarada em texto na V1; futura relação territorial pode referenciar esta presença sem duplicar a sede.';
COMMIT;
