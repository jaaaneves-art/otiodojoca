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

  return details;
}
