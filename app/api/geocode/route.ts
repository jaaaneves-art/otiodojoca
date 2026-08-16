import { NextRequest, NextResponse } from "next/server";

// Geocodifica um código postal português (formato 0000-000) usando o
// Nominatim (OpenStreetMap). Corre no servidor para cumprir a política de
// uso do Nominatim (User-Agent identificável, sem chamadas diretas do browser).

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "OTiodoJoca-CalendarioLunar/1.0 (uso interno, geocoding pontual)";

interface ResultadoNominatim {
  lat: string;
  lon: string;
}

async function pesquisarNominatim(params: URLSearchParams) {
  params.set("format", "jsonv2");
  params.set("limit", "1");

  const resposta = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 60 * 60 * 24 * 30 }, // 30 dias — coordenadas não mudam
  });

  if (!resposta.ok) return null;

  const resultados = (await resposta.json()) as ResultadoNominatim[];
  return resultados[0] ?? null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const codigoPostal = searchParams.get("codigo_postal");
  const nome = searchParams.get("nome");
  const municipio = searchParams.get("municipio");

  if (!codigoPostal || !/^\d{4}-\d{3}$/.test(codigoPostal)) {
    return NextResponse.json(
      { error: "Parâmetro codigo_postal em falta ou inválido (formato 0000-000)." },
      { status: 400 },
    );
  }

  let resultado = await pesquisarNominatim(
    new URLSearchParams({ postalcode: codigoPostal, country: "Portugal" }),
  );

  // O Nominatim tem cobertura irregular de códigos postais em Portugal;
  // se falhar, tenta pelo nome da freguesia/município.
  if (!resultado && nome) {
    resultado = await pesquisarNominatim(
      new URLSearchParams({
        q: [nome, municipio, "Portugal"].filter(Boolean).join(", "),
      }),
    );
  }

  if (!resultado) {
    return NextResponse.json(
      { error: "Não foi possível geocodificar esta localização." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    latitude: parseFloat(resultado.lat),
    longitude: parseFloat(resultado.lon),
  });
}
