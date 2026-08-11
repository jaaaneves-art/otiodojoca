import Link from "next/link";

export default function ComerRootPage() {
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <main className="text-center">
        <h1 className="text-6xl mb-4">🍽️</h1>
        <h2 className="text-3xl font-bold text-orange-900 mb-4">Bem-vindo ao Comer</h2>
        <p className="text-orange-700 text-lg mb-8">Descobre os melhores restaurantes e comidas locais</p>
        
        <Link href="/comer/comer">
          <button className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-lg font-semibold">
            Explorar Restaurantes →
          </button>
        </Link>
      </main>
    </div>
  );
}
