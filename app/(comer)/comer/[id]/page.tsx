import Link from "next/link";
import { notFound } from "next/navigation";

interface Restaurante {
  id: number;
  nome: string;
  descricao: string;
  localizacao: string;
  especialidade: string;
  preco_medio: number;
  rating: number;
  telefone?: string;
  email?: string;
  website?: string;
}

const restaurantes: Restaurante[] = [
  { id: 1, nome: "Tasca do Avô", descricao: "Comida tradicional portuguesa", localizacao: "Covilhã", especialidade: "Arroz de pato", preco_medio: 12, rating: 4.5, telefone: "+351 275 123 456", email: "tascadoavo@example.com", website: "www.tascadoavo.pt" },
  { id: 2, nome: "O Forno", descricao: "Pão e broa caseira", localizacao: "Guarda", especialidade: "Broa de milho", preco_medio: 8, rating: 4.8, telefone: "+351 271 234 567", email: "oforno@example.com" },
  { id: 3, nome: "Casa da Carne", descricao: "Churrascos e grelhados", localizacao: "Belmonte", especialidade: "Frango assado", preco_medio: 15, rating: 4.3, telefone: "+351 275 345 678", website: "www.casadacarne.pt" },
];

export default function RestauranteDetalhePage({ params }: { params: { id: string } }) {
  const restaurante = restaurantes.find((r) => r.id === parseInt(params.id));
  if (!restaurante) notFound();

  return (
    <div className="min-h-screen bg-orange-50">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/comer/comer">
          <button className="mb-6 px-4 py-2 bg-orange-200 text-orange-900 rounded-lg hover:bg-orange-300">← Voltar</button>
        </Link>
        <div className="bg-white rounded-lg border border-orange-200 overflow-hidden">
          <div className="w-full h-64 bg-orange-100 flex items-center justify-center text-8xl">🍽️</div>
          <div className="p-8">
            <p className="text-sm text-orange-500 uppercase mb-2">{restaurante.especialidade}</p>
            <h1 className="text-4xl font-bold text-orange-900 mb-4">{restaurante.nome}</h1>
            <p className="text-lg text-orange-700 mb-4">{restaurante.descricao}</p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-500 uppercase mb-1">Preço</p><p className="text-3xl font-bold text-orange-900">€{restaurante.preco_medio.toFixed(2)}</p></div>
              <div className="bg-orange-50 p-4 rounded-lg"><p className="text-sm text-orange-500 uppercase mb-1">Avaliação</p><p className="text-3xl font-bold text-orange-900">⭐ {restaurante.rating}</p></div>
            </div>
            <div className="border-t border-orange-200 pt-6"><h2 className="text-xl font-semibold text-orange-900 mb-4">Contacto</h2><p className="text-orange-700"><strong>📍</strong> {restaurante.localizacao}</p>{restaurante.telefone && <p className="text-orange-700"><strong>☎️</strong> {restaurante.telefone}</p>}{restaurante.email && <p className="text-orange-700"><strong>📧</strong> {restaurante.email}</p>}{restaurante.website && <p className="text-orange-700"><strong>🌐</strong> {restaurante.website}</p>}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
