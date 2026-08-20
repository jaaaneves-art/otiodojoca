import { Suspense } from 'react';
import { listarAlojamentos } from '@/lib/alojamento/actions';
import AlojamentoCard from '@/components/alojamento/alojamento-card';

export const metadata = {
  title: 'Alojamentos | O Tio do Joca',
  description: 'Descubra alojamentos rurais, casas de turismo e hospedagem em Portugal',
};

function CarregandoAlojamentos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64" />
      ))}
    </div>
  );
}

async function ListaAlojamentos() {
  try {
    const alojamentos = await listarAlojamentos();

    if (!alojamentos || alojamentos.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Nenhum alojamento disponível no momento.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {alojamentos.map(alojamento => (
          <AlojamentoCard key={alojamento.id} alojamento={alojamento} />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Erro ao listar alojamentos:', error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700">
          Erro ao carregar alojamentos. Tente novamente mais tarde.
        </p>
      </div>
    );
  }
}

export default function AlojamentoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-blue-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Onde Pernoitar</h1>
          <p className="text-blue-100 text-lg">
            Descubra casas rurais, pousadas e alojamentos autênticos para uma estadia inesquecível.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Alojamentos Disponíveis</h2>
          <p className="text-gray-600">
            Encontre o alojamento perfeito para sua próxima visita ao concelho de Guimarães.
          </p>
        </div>

        <Suspense fallback={<CarregandoAlojamentos />}>
          <ListaAlojamentos />
        </Suspense>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🏨</div>
              <h3 className="font-bold text-gray-900 mb-1">Variedade</h3>
              <p className="text-sm text-gray-600">Hotéis, casas rurais, pousadas e muito mais</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🍽️</div>
              <h3 className="font-bold text-gray-900 mb-1">Refeições</h3>
              <p className="text-sm text-gray-600">Com ou sem pequeno-almoço, meia-pensão ou pensão completa</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💚</div>
              <h3 className="font-bold text-gray-900 mb-1">Autêntico</h3>
              <p className="text-sm text-gray-600">Experiências genuínas e acolhedoras</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
