import { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterAlojamentoComRefeicoes } from "@/lib/alojamento/actions";
import ReservaForm from "@/components/alojamento/reserva-form";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterAlojamentoComRefeicoes(id);
  
  if (!dados) {
    return { title: "Alojamento não encontrado" };
  }
  
  return {
    title: `${dados.nome} | Reservas`,
    description: dados.descricao || `Reserve o ${dados.nome}`,
  };
}

export default async function AlojamentoDetalhePage({ params }: Props) {
  const { id } = await params;
  const dados = await obterAlojamentoComRefeicoes(id);

  if (!dados) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">{dados.nome}</h1>

          {dados.localizacao && (
            <div className="mb-2 text-gray-600">
              {dados.localizacao.morada && <p>{dados.localizacao.morada}</p>}
              <p>
                {[
                  dados.localizacao.codigo_postal,
                  dados.localizacao.localidade,
                  dados.localizacao.municipio,
                  dados.localizacao.distrito,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
              {dados.localizacao.latitude && dados.localizacao.longitude && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${dados.localizacao.latitude},${dados.localizacao.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 hover:underline text-sm"
                >
                  📍 Ver no Google Maps
                </a>
              )}
            </div>
          )}

          <p className="text-2xl font-semibold text-emerald-600 mb-6 mt-4">
            €{dados.preco_noite}/noite
          </p>

          {dados.imagem && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
              <Image
                src={dados.imagem}
                alt={dados.nome}
                fill
                className="object-cover"
              />
            </div>
          )}
          
          <div className="prose max-w-none">
            <p>{dados.descricao}</p>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Comodidades</h3>
            <div className="flex flex-wrap gap-2">
              {dados.comodidades?.map((c: string) => (
                <span
                  key={c}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg h-fit">
          <h2 className="text-xl font-bold mb-4">Faça a sua reserva</h2>
          <ReservaForm 
            alojamento={dados} 
            refeicoes={dados.refeicoes || []} 
          />
        </div>
      </div>
    </main>
  );
}
