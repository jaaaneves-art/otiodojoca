// Monta o details (jsonb) de um anúncio de imóvel a partir do FormData do
// imoveis-ad-form.tsx. Extraído para ficheiro próprio (em vez de repetido
// dentro de app/imoveis/novo/page.tsx e app/imoveis/editar/[id]/page.tsx,
// como o Gran Bazar faz com a lógica equivalente inline nos dois sítios)
// porque aqui as duas páginas precisam exatamente do mesmo resultado — um
// imóvel muda de "venda" para "leilão" numa edição tem de gerar o mesmo
// payload que a criação, para o trigger
// gran_bazar_create_auction_if_needed (migration
// 20260824010000_imoveis.sql) conseguir ler as chaves de leilão.
export function buildImovelDetails(type: string, formData: FormData): Record<string, string> {
  const details: Record<string, string> = {
    area: formData.get("area") as string,
    condition: formData.get("propertyCondition") as string,
  };

  const bedrooms = formData.get("bedrooms") as string;
  const bathrooms = formData.get("bathrooms") as string;
  const yearBuilt = formData.get("yearBuilt") as string;
  if (bedrooms) details.bedrooms = bedrooms;
  if (bathrooms) details.bathrooms = bathrooms;
  if (yearBuilt) details.year_built = yearBuilt;

  if (type === "leilao") {
    // Convertido para ISO (UTC) no browser antes de chegar aqui — ver
    // imoveis-ad-form.tsx (datetimeLocalParaIso). O trigger lê estas
    // chaves com ::numeric/::timestamptz explícitos.
    const startPrice = formData.get("auctionStartPrice") as string;
    const minIncrement = formData.get("auctionMinIncrement") as string;
    const startsAt = formData.get("auctionStartsAt") as string;
    const endsAt = formData.get("auctionEndsAt") as string;

    if (!startPrice || !endsAt) {
      throw new Error("Leilão: preço inicial e data de encerramento são obrigatórios");
    }

    details.start_price = startPrice;
    details.minimum_increment = minIncrement || "1000.00";
    if (startsAt) details.starts_at = startsAt;
    details.ends_at = endsAt;
  }

  if (type === "arrendamento") {
    const mobilado = formData.get("mobilado") as string;
    const despesasIncluidas = formData.get("despesasIncluidas") as string;
    const caucao = formData.get("caucao") as string;
    const disponivelDesde = formData.get("disponivelDesde") as string;
    const duracaoMinima = formData.get("duracaoMinima") as string;
    if (mobilado) details.mobilado = mobilado;
    if (despesasIncluidas) details.despesas_incluidas = despesasIncluidas;
    if (caucao) details.caucao = caucao;
    if (disponivelDesde) details.disponivel_desde = disponivelDesde;
    if (duracaoMinima) details.duracao_minima = duracaoMinima;
  }

  if (type === "permuta") {
    const procuraEmTroca = formData.get("procuraEmTroca") as string;
    const aceitaComDiferenca = formData.get("aceitaComDiferenca") as string;
    if (procuraEmTroca) details.procura_em_troca = procuraEmTroca;
    if (aceitaComDiferenca) details.aceita_com_diferenca = "true";
  }

  if (type === "quarto") {
    const tipoQuarto = formData.get("tipoQuarto") as string;
    const casaBanho = formData.get("casaBanho") as string;
    const pessoasNaCasa = formData.get("pessoasNaCasa") as string;
    const aceitaCasais = formData.get("aceitaCasais") as string;
    const mobilado = formData.get("mobilado") as string;
    const despesasIncluidas = formData.get("despesasIncluidas") as string;
    const caucao = formData.get("caucao") as string;
    const disponivelDesde = formData.get("disponivelDesde") as string;
    const duracaoMinima = formData.get("duracaoMinima") as string;
    const comodidades = formData.getAll("comodidades") as string[];
    if (tipoQuarto) details.tipo_quarto = tipoQuarto;
    if (casaBanho) details.casa_banho = casaBanho;
    if (pessoasNaCasa) details.pessoas_na_casa = pessoasNaCasa;
    if (aceitaCasais) details.aceita_casais = "true";
    if (mobilado) details.mobilado = mobilado;
    if (despesasIncluidas) details.despesas_incluidas = despesasIncluidas;
    if (caucao) details.caucao = caucao;
    if (disponivelDesde) details.disponivel_desde = disponivelDesde;
    if (duracaoMinima) details.duracao_minima = duracaoMinima;
    if (comodidades.length > 0) details.comodidades = comodidades.join(",");
  }

  if (type === "companhia") {
    const apoioEsperado = formData.get("apoioEsperado") as string;
    const regrasDaCasa = formData.get("regrasDaCasa") as string;
    const duracaoMinima = formData.get("duracaoMinima") as string;
    if (apoioEsperado) details.apoio_esperado = apoioEsperado;
    if (regrasDaCasa) details.regras_da_casa = regrasDaCasa;
    if (duracaoMinima) details.duracao_minima = duracaoMinima;
  }

  // "Para estudantes" e "vagas disponíveis" (partilha de casa) aplicam-se a
  // arrendamento e companhia — nos outros tipos o formulário nem sequer
  // mostra estes campos (ver mostra("paraEstudantes") em
  // imoveis-ad-form.tsx), por isso não há risco de aparecerem fora de
  // contexto.
  const paraEstudantes = formData.get("paraEstudantes") as string;
  const vagasDisponiveis = formData.get("vagasDisponiveis") as string;
  if (paraEstudantes) details.para_estudantes = "true";
  if (vagasDisponiveis) details.vagas_disponiveis = vagasDisponiveis;

  return details;
}
