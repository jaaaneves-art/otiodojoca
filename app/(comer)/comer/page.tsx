import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ComerPage() {
  const supabase = createClient();

  const { data: restaurantes, error } = await supabase
    .from("restaurantes")
    .select(`
      id,
      nome,
      descricao,
      especialidade,
      preco_medio,
      rating,
      localizacao:localizacoes (
        id,
        codigo_postal,
        nome,
        localidade,
        municipio,
        distrito,
        latitude,
        longitude
      )
    `)
    .order("nome");

  if (error) {
    throw new Error("Erro ao carregar restaurantes: " + error.message);
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-orange-900 mb-2">
            🍽️ Comer
          </h1>

          <p className="text-orange-700 text-lg">
            Descobre os melhores restaurantes e comidas locais
          </p>
        </div>

        {restaurantes && restaurantes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurantes.map((restaurante) => (
              <Link
                key={restaurante.id}
                href={`/comer/${restaurante.id}`}
              >
                <div className="bg-white rounded-lg border border-orange-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
                  <div className="w-full h-40 bg-orange-100 flex items-center justify-center text-5xl">
                    🍽️
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-orange-500 uppercase tracking-wide mb-2">
                        {restaurante.especialidade}
                      </p>

                      <h3 className="font-semibold text-orange-900 line-clamp-2 mb-2">
                        {restaurante.nome}
                      </h3>

                      <p className="text-sm text-orange-700 line-clamp-2 mb-3">
                        {restaurante.descricao}
                      </p>
                    </div>

                    <div>
                      <p className="text-lg font-bold text-orange-800 mb-2">
                        €{Number(restaurante.preco_medio).toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-orange-500">
                          📍 {restaurante.localizacao?.[0]?.municipio ?? "—"}
                        </p>

                        <p className="text-sm text-orange-600">
                          ⭐ {restaurante.rating}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-orange-200 bg-white p-8 text-center">
            <p className="text-lg text-orange-900">
              Ainda não existem restaurantes registados.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
