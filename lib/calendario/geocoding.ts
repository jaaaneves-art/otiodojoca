export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export async function obterCoordenadasPorCodigoPostal(
  codigoPostal: string,
  opcoes?: { nome?: string; municipio?: string; signal?: AbortSignal },
): Promise<Coordenadas> {
  const parametros = new URLSearchParams({ codigo_postal: codigoPostal });
  if (opcoes?.nome) parametros.set("nome", opcoes.nome);
  if (opcoes?.municipio) parametros.set("municipio", opcoes.municipio);

  const resposta = await fetch(`/api/geocode?${parametros.toString()}`, {
    signal: opcoes?.signal,
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível obter as coordenadas desta localização.");
  }

  return (await resposta.json()) as Coordenadas;
}
