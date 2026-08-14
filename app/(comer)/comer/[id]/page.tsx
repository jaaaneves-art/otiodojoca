import Link from "next/link";
import { notFound } from "next/navigation";
import ReservaForm from "@/components/comer/reserva-form";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: {
    id: string;
  };
}

export default async function RestauranteDetalhePage({ params }: Props) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const supabase = createClient();

  const { data: restaurante, error: restauranteError } = await supabase
    .from("restaurantes")
    .select(`
      id,
      nome,
      descricao,
      especialidade,
      preco_medio,
      rating,
      telefone,
      email,
      website,
      localizacao_id
    `)
    .eq("id", id)
    .single();

  if (restauranteError || !restaurante) {
    notFound();
  }

  let localizacao = null;

  if (restaurante.localizacao_id) {
    const { data: localizacaoData, error: localizacaoError } = await supabase
      .from("localizacoes")
      .select(`
        id,
        codigo_postal,
        nome,
        localidade,
        municipio,
        distrito,
        latitude,
        longitude
      `)
      .eq("id", restaurante.localizacao_id)
      .single();

    if (!localizacaoError) {
      localizacao = localizacaoData;
    }
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/comer">
          <button className="mb-6 px-4 py-2 bg-orange-200 text-orange-900 rounded-lg hover:bg-orange-300">
            ← Voltar
          </button>
        </Link>

        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden mb-8">
          <div className="w-full h-64 bg-orange-100 flex items-center justify-center text-8xl">
            🍽️
          </div>

          <div className="p-8">
            <p className="text-sm text-orange-500 uppercase mb-2">
              {restaurante.especialidade}
            </p>

            <h1 className="text-4xl font-bold text-orange-900 mb-4">
              {restaurante.nome}
            </h1>

            <p className="text-lg text-orange-700 mb-4">
              {restaurante.descricao}
            </p>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-500 uppercase mb-1">
                  Preço
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  €{Number(restaurante.preco_medio).toFixed(2)}
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-orange-500 uppercase mb-1">
                  Avaliação
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  ⭐ {restaurante.rating}
                </p>
              </div>
            </div>

            <div className="border-t border-orange-200 pt-6">
              <h2 className="text-xl font-semibold text-orange-900 mb-4">
                Contacto
              </h2>

              {localizacao ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${localizacao.latitude},${localizacao.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-700 hover:text-orange-900 hover:underline"
                  title="Abrir localização no Google Maps"
                >
                  <strong>📍</strong>{" "}
                  {[
                    localizacao.nome,
                    localizacao.localidade,
                    localizacao.municipio,
                    localizacao.distrito,
                    localizacao.codigo_postal,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </a>
              ) : (
                <p className="text-orange-700">
                  <strong>📍</strong> Localização não disponível
                </p>
              )}

              {restaurante.telefone && (
                <p className="text-orange-700">
                  <strong>☎️</strong> {restaurante.telefone}
                </p>
              )}

              {restaurante.email && (
                <p className="text-orange-700">
                  <strong>📧</strong> {restaurante.email}
                </p>
              )}

              {restaurante.website && (
                <p className="text-orange-700">
                  <strong>🌐</strong> {restaurante.website}
                </p>
              )}
            </div>
          </div>
        </div>

        <ReservaForm
          restauranteId={Number(restaurante.id)}
          restauranteNome={restaurante.nome}
        />
      </main>
    </div>
  );
}
