// Base de dados de marcas e modelos de automóveis, para sugestões (autocomplete)
// no formulário de anúncio e nos filtros de pesquisa do StandGo.
//
// Objeto estático, sem ligação à base de dados — serve só para sugerir,
// nunca restringe: o utilizador continua livre de escrever qualquer marca
// ou modelo que não esteja aqui (carros mais raros, importações, etc.).
//
// Adaptada a partir do projeto de referência AutoNex (ver
// docs/pendentes/STANDGO-REFORCO-AUTONEX-RENOME-20260829.md), 30/08/2026.

export const MARCAS_MODELOS: Record<string, string[]> = {
  "Abarth": ["500", "595", "695", "124 Spider", "Punto"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "Giulietta", "MiTo", "159", "147", "4C", "Brera", "Spider"],
  "Alpine": ["A110", "A290"],
  "Aston Martin": ["DB11", "DB12", "DBS", "Vantage", "DBX", "Rapide"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "e-tron GT", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "S3", "S4", "S5"],
  "Bentley": ["Continental GT", "Flying Spur", "Bentayga"],
  "BMW": ["Série 1", "Série 2", "Série 3", "Série 4", "Série 5", "Série 7", "Série 8", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "Z4", "i3", "i4", "i5", "i7", "iX", "iX1", "iX3", "M2", "M3", "M4", "M5"],
  "BYD": ["Atto 3", "Seal", "Seal U", "Dolphin", "Han", "Tang", "Song Plus"],
  "Chevrolet": ["Camaro", "Corvette", "Captiva", "Cruze", "Spark", "Trax", "Malibu"],
  "Chrysler": ["300C", "Pacifica", "Voyager"],
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C5 Aircross", "C5 X", "Berlingo", "SpaceTourer", "Ami"],
  "Cupra": ["Formentor", "Leon", "Ateca", "Born", "Tavascan", "Terramar"],
  "Dacia": ["Sandero", "Duster", "Jogger", "Logan", "Spring", "Bigster"],
  "Dodge": ["Challenger", "Charger", "Durango", "Hornet"],
  "DS": ["DS 3", "DS 4", "DS 7", "DS 9"],
  "Ferrari": ["Roma", "Portofino", "F8", "SF90", "296 GTB", "Purosangue", "812"],
  "Fiat": ["500", "500e", "Panda", "Tipo", "500X", "Doblo", "Ducato"],
  "Ford": ["Fiesta", "Focus", "Puma", "Kuga", "Mustang", "Mustang Mach-E", "Explorer", "Ranger", "Transit", "Mondeo"],
  "Genesis": ["G70", "G80", "GV60", "GV70", "GV80"],
  "Honda": ["Civic", "Jazz", "CR-V", "HR-V", "e:Ny1", "Accord", "ZR-V"],
  "Hyundai": ["i10", "i20", "i30", "Tucson", "Santa Fe", "Kona", "Ioniq 5", "Ioniq 6", "Bayon", "Nexo"],
  "Infiniti": ["Q50", "QX50", "QX60", "QX80"],
  "Jaguar": ["XE", "XF", "F-Pace", "E-Pace", "I-Pace", "F-Type"],
  "Jeep": ["Renegade", "Compass", "Wrangler", "Grand Cherokee", "Avenger", "Gladiator"],
  "Kia": ["Picanto", "Rio", "Ceed", "Sportage", "Sorento", "Niro", "EV6", "EV9", "Stonic", "XCeed"],
  "Lamborghini": ["Huracán", "Urus", "Revuelto", "Temerario"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Range Rover Velar"],
  "Lexus": ["UX", "NX", "RX", "ES", "LS", "LC", "LBX", "RZ"],
  "Lotus": ["Emira", "Eletre", "Evija"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "Grecale", "MC20", "GranTurismo"],
  "Mazda": ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-80", "MX-5", "MX-30"],
  "McLaren": ["Artura", "720S", "GT", "750S"],
  "Mercedes-Benz": ["Classe A", "Classe B", "Classe C", "Classe E", "Classe S", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "AMG GT", "SL"],
  "MG": ["MG3", "MG4", "MG5", "ZS", "HS", "Cyberster", "Marvel R"],
  "MINI": ["Cooper", "Countryman", "Clubman", "Cabrio", "John Cooper Works", "Aceman"],
  "Mitsubishi": ["ASX", "Eclipse Cross", "Outlander", "Space Star", "L200", "Pajero"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "Navara", "GT-R"],
  "Opel": ["Corsa", "Astra", "Mokka", "Crossland", "Grandland", "Insignia", "Combo", "Vivaro"],
  "Peugeot": ["208", "2008", "308", "3008", "5008", "408", "508", "Rifter", "Traveller", "e-208", "e-2008"],
  "Polestar": ["2", "3", "4"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Cayenne", "Macan", "Panamera", "Taycan"],
  "Renault": ["Clio", "Captur", "Megane", "Arkana", "Austral", "Scenic", "Espace", "Kangoo", "Trafic", "Zoe", "5 E-Tech", "Rafale"],
  "Rolls-Royce": ["Ghost", "Phantom", "Cullinan", "Spectre"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Mii"],
  "Škoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Elroq"],
  "Smart": ["#1", "#3", "Fortwo", "Forfour"],
  "Subaru": ["Impreza", "XV", "Forester", "Outback", "BRZ", "Solterra"],
  "Suzuki": ["Swift", "Ignis", "Vitara", "S-Cross", "Jimny", "Across", "Swace"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  "Toyota": ["Aygo X", "Yaris", "Corolla", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Hilux", "Prius", "bZ4X", "Camry", "GR86", "Supra"],
  "Volkswagen": ["Polo", "Golf", "Passat", "T-Roc", "Tiguan", "Touareg", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "Arteon", "Caddy", "Transporter", "Amarok"],
  "Volvo": ["XC40", "XC60", "XC90", "S60", "S90", "V60", "V90", "C40", "EX30", "EX90"],
  "XPeng": ["G6", "G9", "P7"],
};

/** Lista de marcas ordenada alfabeticamente (PT), para autocomplete. */
export const MARCAS: string[] = Object.keys(MARCAS_MODELOS).sort((a, b) =>
  a.localeCompare(b, "pt")
);

/** Modelos conhecidos de uma marca. Devolve [] se a marca não existir na base (marca "livre", fora da lista). */
export function getModelos(marca: string): string[] {
  return MARCAS_MODELOS[marca] ?? [];
}
