// lib/marketplace/cae-lista.ts
//
// Lista de códigos CAE (Classificação Portuguesa das Atividades
// Económicas, Rev.3) usada pelo campo opcional "Atividade Económica"
// nos módulos de marketplace (Retailing, Beleza, Consultórios, Mediação).
//
// IMPORTANTE — cobertura, não exaustividade:
// A CAE-Rev.3 completa tem centenas de subclasses de 5 dígitos em 21
// secções (A a U). Não há aqui uma fonte oficial acessível em CSV/JSON a
// partir desta sessão (o portal do INE e o simulador do Portal das
// Finanças não têm um export estruturado público) — esta lista foi
// composta a partir de fontes públicas verificadas (estrutura oficial
// CAE-Rev.3/NACE Rev.2) e cobre com detalhe os setores diretamente
// usados pelos quatro módulos (comércio a retalho 47xxx, cabeleireiro/
// estética 96xxx, saúde/clínicas 86xxx, seguros e crédito 64-66xxx),
// mais uma cobertura geral dos restantes setores mais comuns numa
// plataforma rural/comunitária (agricultura, construção, alojamento e
// restauração, imobiliário, serviços profissionais).
//
// Isto é só metadado informativo no anúncio — não é usado para fins
// fiscais ou legais. Antes de depender disto para esse efeito, confirma
// sempre no simulador de CAE do Portal das Finanças.

export interface CaeEntry {
  codigo: string; // 5 dígitos
  descricao: string;
}

export const CAE_LISTA: CaeEntry[] = [
  // ==================== A — AGRICULTURA, PRODUÇÃO ANIMAL, CAÇA ====================
  { codigo: '01110', descricao: 'Cultura de cereais (exceto arroz), leguminosas secas e sementes oleaginosas' },
  { codigo: '01130', descricao: 'Cultura de produtos hortícolas, raízes e tubérculos' },
  { codigo: '01210', descricao: 'Viticultura' },
  { codigo: '01240', descricao: 'Cultura de fruta de pomóideas e prunóideas' },
  { codigo: '01260', descricao: 'Cultura de frutos oleaginosos (azeitona, etc.)' },
  { codigo: '01410', descricao: 'Produção de leite' },
  { codigo: '01450', descricao: 'Criação de ovinos e caprinos' },
  { codigo: '01470', descricao: 'Avicultura' },
  { codigo: '01500', descricao: 'Agricultura e produção animal combinadas' },
  { codigo: '01610', descricao: 'Atividades de apoio à produção vegetal' },
  { codigo: '02100', descricao: 'Silvicultura e outras atividades florestais' },
  { codigo: '03220', descricao: 'Aquicultura em águas doces' },

  // ==================== C — INDÚSTRIAS TRANSFORMADORAS ====================
  { codigo: '10110', descricao: 'Abate de gado (produção de carne)' },
  { codigo: '10710', descricao: 'Panificação, e fabricação de produtos frescos de padaria e pastelaria' },
  { codigo: '10840', descricao: 'Fabricação de condimentos e temperos' },
  { codigo: '11020', descricao: 'Fabricação de vinhos comuns e licorosos' },
  { codigo: '11050', descricao: 'Fabricação de cerveja' },
  { codigo: '14130', descricao: 'Confeção de outro vestuário exterior' },
  { codigo: '16290', descricao: 'Fabricação de outras obras de carpintaria para a construção' },
  { codigo: '23610', descricao: 'Fabricação de produtos de betão para a construção' },
  { codigo: '31090', descricao: 'Fabricação de outros móveis' },

  // ==================== F — CONSTRUÇÃO ====================
  { codigo: '41200', descricao: 'Construção de edifícios (residenciais e não residenciais)' },
  { codigo: '42110', descricao: 'Construção de estradas e outras vias de comunicação' },
  { codigo: '43110', descricao: 'Demolição' },
  { codigo: '43210', descricao: 'Instalação elétrica' },
  { codigo: '43220', descricao: 'Instalação de canalizações, redes de água, gás e climatização' },
  { codigo: '43330', descricao: 'Revestimento de pavimentos e paredes' },
  { codigo: '43341', descricao: 'Pintura' },
  { codigo: '43910', descricao: 'Actividades de construção de coberturas' },
  { codigo: '43999', descricao: 'Outras atividades especializadas de construção diversas' },

  // ==================== G — COMÉRCIO (detalhado, comércio a retalho 47xxx) ====================
  { codigo: '45111', descricao: 'Comércio de automóveis ligeiros' },
  { codigo: '45200', descricao: 'Manutenção e reparação de veículos automóveis' },
  { codigo: '46110', descricao: 'Agentes do comércio por grosso de matérias-primas agrícolas' },
  { codigo: '46390', descricao: 'Comércio por grosso não especializado de produtos alimentares, bebidas e tabaco' },
  { codigo: '47111', descricao: 'Comércio a retalho em supermercados e hipermercados' },
  { codigo: '47112', descricao: 'Comércio a retalho em minimercados' },
  { codigo: '47190', descricao: 'Comércio a retalho de outros produtos, em estabelecimentos não especializados' },
  { codigo: '47210', descricao: 'Comércio a retalho de fruta e produtos hortícolas, em estabelecimentos especializados' },
  { codigo: '47220', descricao: 'Comércio a retalho de carne e produtos à base de carne, em estabelecimentos especializados' },
  { codigo: '47230', descricao: 'Comércio a retalho de peixe, crustáceos e moluscos, em estabelecimentos especializados' },
  { codigo: '47240', descricao: 'Comércio a retalho de pão, produtos de pastelaria e confeitaria, em estabelecimentos especializados' },
  { codigo: '47250', descricao: 'Comércio a retalho de bebidas, em estabelecimentos especializados' },
  { codigo: '47291', descricao: 'Comércio a retalho de produtos hortícolas transformados, em conserva ou desidratados' },
  { codigo: '47410', descricao: 'Comércio a retalho de computadores, unidades periféricas e programas informáticos' },
  { codigo: '47420', descricao: 'Comércio a retalho de equipamento de telecomunicações' },
  { codigo: '47510', descricao: 'Comércio a retalho de têxteis, em estabelecimentos especializados' },
  { codigo: '47591', descricao: 'Comércio a retalho de móveis para casa' },
  { codigo: '47620', descricao: 'Comércio a retalho de jornais, revistas e artigos de papelaria, em estabelecimentos especializados' },
  { codigo: '47630', descricao: 'Comércio a retalho de artigos culturais e recreativos, em estabelecimentos especializados' },
  { codigo: '47711', descricao: 'Comércio a retalho de vestuário para adultos, em estabelecimentos especializados' },
  { codigo: '47712', descricao: 'Comércio a retalho de vestuário para crianças e bebés, em estabelecimentos especializados' },
  { codigo: '47721', descricao: 'Comércio a retalho de calçado, em estabelecimentos especializados' },
  { codigo: '47730', descricao: 'Comércio a retalho de produtos farmacêuticos, em estabelecimentos especializados' },
  { codigo: '47741', descricao: 'Comércio a retalho de produtos médicos e ortopédicos, em estabelecimentos especializados' },
  { codigo: '47750', descricao: 'Comércio a retalho de produtos cosméticos e de higiene, em estabelecimentos especializados' },
  { codigo: '47761', descricao: 'Comércio a retalho de flores, plantas, sementes e fertilizantes, em estabelecimentos especializados' },
  { codigo: '47762', descricao: 'Comércio a retalho de animais de companhia e respetivos alimentos' },
  { codigo: '47782', descricao: 'Comércio a retalho de material ótico, fotográfico e cronometria' },
  { codigo: '47789', descricao: 'Comércio a retalho de outros produtos novos, em estabelecimentos especializados, n.e.' },
  { codigo: '47791', descricao: 'Comércio a retalho de bens em segunda mão, em estabelecimentos' },
  { codigo: '47810', descricao: 'Comércio a retalho de produtos alimentares, bebidas e tabaco, em bancas de venda e feiras' },
  { codigo: '47820', descricao: 'Comércio a retalho de têxteis, vestuário e calçado, em bancas de venda e feiras' },
  { codigo: '47910', descricao: 'Comércio a retalho por correspondência ou via Internet' },
  { codigo: '47990', descricao: 'Outro comércio a retalho não efetuado em estabelecimentos, bancas ou feiras' },

  // ==================== H — TRANSPORTES E ARMAZENAGEM ====================
  { codigo: '49320', descricao: 'Transporte de passageiros em táxis' },
  { codigo: '49391', descricao: 'Transportes rodoviários ocasionais de passageiros' },
  { codigo: '49410', descricao: 'Transportes rodoviários de mercadorias' },
  { codigo: '52290', descricao: 'Outras atividades auxiliares dos transportes' },
  { codigo: '53200', descricao: 'Outras atividades postais e de courier' },

  // ==================== I — ALOJAMENTO, RESTAURAÇÃO E SIMILARES ====================
  { codigo: '55111', descricao: 'Hotéis com restaurante' },
  { codigo: '55201', descricao: 'Alojamento mobilado para turistas' },
  { codigo: '55202', descricao: 'Turismo no espaço rural, turismo de habitação' },
  { codigo: '55204', descricao: 'Alojamento local (moradia, apartamento e estabelecimentos de hospedagem)' },
  { codigo: '56101', descricao: 'Restaurantes tipo tradicional' },
  { codigo: '56107', descricao: 'Restaurantes, n.e. (com espaço de dança, self-service, etc.)' },
  { codigo: '56210', descricao: 'Fornecimento de refeições para eventos (catering)' },
  { codigo: '56301', descricao: 'Cafés' },
  { codigo: '56302', descricao: 'Bares' },

  // ==================== J — INFORMAÇÃO E COMUNICAÇÃO ====================
  { codigo: '62010', descricao: 'Atividades de programação informática' },
  { codigo: '62020', descricao: 'Atividades de consultoria em informática' },

  // ==================== K — ATIVIDADES FINANCEIRAS E DE SEGUROS ====================
  { codigo: '64191', descricao: 'Outra intermediação monetária (bancos)' },
  { codigo: '64920', descricao: 'Outra concessão de crédito' },
  { codigo: '64991', descricao: 'Atividades das sociedades gestoras de participações sociais não financeiras (SGPS)' },
  { codigo: '65110', descricao: 'Seguro de vida' },
  { codigo: '65120', descricao: 'Seguros, exceto de vida (seguro não vida)' },
  { codigo: '66190', descricao: 'Outras atividades auxiliares de serviços financeiros, exceto seguros e fundos de pensões' },
  { codigo: '66220', descricao: 'Atividades dos mediadores de seguros' },
  { codigo: '66300', descricao: 'Atividades de gestão de fundos' },

  // ==================== L — ATIVIDADES IMOBILIÁRIAS ====================
  { codigo: '68100', descricao: 'Compra e venda de bens imobiliários' },
  { codigo: '68200', descricao: 'Arrendamento de bens imobiliários' },
  { codigo: '68311', descricao: 'Atividades de mediação imobiliária' },
  { codigo: '68321', descricao: 'Administração de imóveis por conta de outrem' },

  // ==================== M — ATIVIDADES DE CONSULTORIA, CIENTÍFICAS E TÉCNICAS ====================
  { codigo: '69101', descricao: 'Atividades jurídicas' },
  { codigo: '69201', descricao: 'Atividades de contabilidade e auditoria' },
  { codigo: '70220', descricao: 'Atividades de consultoria para os negócios e a gestão' },
  { codigo: '71112', descricao: 'Atividades de engenharia e técnicas afins' },
  { codigo: '71200', descricao: 'Atividades de ensaios e de análises técnicas' },
  { codigo: '73110', descricao: 'Agências de publicidade' },
  { codigo: '74101', descricao: 'Atividades de design' },
  { codigo: '75000', descricao: 'Atividades veterinárias' },

  // ==================== N — ATIVIDADES ADMINISTRATIVAS E DOS SERVIÇOS DE APOIO ====================
  { codigo: '77110', descricao: 'Aluguer de veículos automóveis ligeiros' },
  { codigo: '79110', descricao: 'Atividades das agências de viagem' },
  { codigo: '81210', descricao: 'Atividades de limpeza geral em edifícios' },
  { codigo: '81300', descricao: 'Atividades de plantação e manutenção de jardins' },

  // ==================== P — EDUCAÇÃO ====================
  { codigo: '85520', descricao: 'Ensino desportivo e recreativo' },
  { codigo: '85530', descricao: 'Atividades das escolas de condução' },
  { codigo: '85591', descricao: 'Formação profissional' },

  // ==================== Q — SAÚDE HUMANA E APOIO SOCIAL (detalhado) ====================
  { codigo: '86100', descricao: 'Atividades dos estabelecimentos de saúde com internamento' },
  { codigo: '86210', descricao: 'Atividades de prática médica de clínica geral, em ambulatório' },
  { codigo: '86220', descricao: 'Atividades de prática médica de clínica especializada, em ambulatório' },
  { codigo: '86230', descricao: 'Atividades de medicina dentária e odontologia' },
  { codigo: '86904', descricao: 'Atividades de fisioterapia' },
  { codigo: '86905', descricao: 'Atividades de psicologia e psicanálise' },
  { codigo: '86906', descricao: 'Atividades de terapia da fala, nutrição e outras atividades de saúde humana, n.e.' },
  { codigo: '87300', descricao: 'Atividades de apoio social para pessoas idosas e com deficiência, com alojamento' },
  { codigo: '88101', descricao: 'Atividades de cuidados para pessoas idosas, sem alojamento' },

  // ==================== R — ATIVIDADES ARTÍSTICAS, DE ESPETÁCULOS, DESPORTIVAS E RECREATIVAS ====================
  { codigo: '90020', descricao: 'Atividades de apoio às artes do espetáculo' },
  { codigo: '93130', descricao: 'Atividades de ginásio (fitness)' },
  { codigo: '93290', descricao: 'Outras atividades recreativas e de lazer, n.e.' },

  // ==================== S — OUTRAS ATIVIDADES DE SERVIÇOS (detalhado — beleza) ====================
  { codigo: '95230', descricao: 'Reparação de calçado e artigos de couro' },
  { codigo: '96021', descricao: 'Salões de cabeleireiro' },
  { codigo: '96022', descricao: 'Institutos de beleza' },
  { codigo: '96023', descricao: 'Atividades de manicura e pedicura' },
  { codigo: '96040', descricao: 'Atividades de bem-estar físico (spa, massagens não terapêuticas)' },
  { codigo: '96090', descricao: 'Outras atividades de serviços pessoais, n.e.' },
];

/** Total de entradas na lista (usado só para referência/log). */
export const CAE_LISTA_TOTAL = CAE_LISTA.length;
