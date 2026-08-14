import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { obterAlojamentoComRefeicoes } from '@/lib/alojamento/actions';
import ReservaForm from '@/components/alojamento/reserva-form';

interface Props {
  params: { id: string };
}

function getGoogleMapsUrl(latitude?: number, longitude?: number) {
  if (!latitude || !longitude) return null;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function formatarEndereco(localizacao: any) {
  const partes = [
    localizacao.nome,
    localizacao.localidade,
    localizacao.municipio,
    localizacao.distrito,
    localizacao.codigo_postal,
  ].filter(Boolean);
  return partes.join(' • ');
}

export async function generateMetadata({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return { title: 'Alojamento não encontrado' };
  }
  try {
    const alojamento = await obterAlojamentoComRefeicoes(id);
    return {
      title: `${alojamento.nome} | O Tio do Joca`,
      description: alojamento.descricao || 'Alojamento em Portugal',
    };
  } catch {
    return { title: 'Alojamento não encontrado' };
  }
}

function CarregandoDetalhe() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-200 animate-pulse h-96 rounded-lg" />
      <div className="bg-gray-200 animate-pulse h-48 rounded-lg" />
    </div>
  );
}

async function DetalheAlojamento({ id }: { id: number }) {
  let dados;
  try {
    dados = await obterAlojamentoComRefeicoes(id);
  } catch (error) {
    console.error('Erro ao buscar alojamento:', error);
    notFound();
  }

  const googleMapsUrl = getGoogleMapsUrl(dados.localizacao.latitude, dados.localizacao.longitude);
  const enderecoFormatado = formatarEndereco(dados.localizacao);

  const tiposMap: Record<string, string> = {
    hotel: '🏨 Hotel',
    pousada: '🏠 Pousada',
    casa_rural: '🏡 Casa Rural',
    hostel: '🛏️ Hostel',
    apartamento: '🏘️ Apartamento',
    chalé: '🌲 Chalé',
    quinta: '🚜 Quinta',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tiposMap[dados.tipo] || dados.tipo}</span>
            {dados.rating && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1">
                <span className="font-bold text-yellow-700">⭐ {dados.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-gray-900">{dados.nome}</h1>
        </div>

        {dados.descricao && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed">{dados.descricao}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🛏️</div>
            <div className="text-sm text-gray-600">Quartos</div>
            <div className="text-2xl font-bold text-gray-900">{dados.num_quartos}</div>
          </div>
          {dados.num_camas && (
            <div className="bg-white border rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">🌙</div>
              <div className="text-sm text-gray-600">Camas</div>
              <div className="text-2xl font-bold text-gray-900">{dados.num_camas}</div>
            </div>
          )}
          <div className="bg-white border rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">💰</div>
            <div className="text-sm text-gray-600">Preço/Noite</div>
            <div className="text-2xl font-bold text-blue-600">€{dados.preco_noite.toFixed(2)}</div>
          </div>

          <a
            href={googleMapsUrl || '#'}
            target={googleMapsUrl ? '_blank' : undefined}
            rel={googleMapsUrl ? 'noopener noreferrer' : undefined}
            className="bg-white border rounded-lg p-4 text-center hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer block"
          >
            <div className="text-3xl mb-2">🌍</div>
            <div className="text-sm text-gray-600">Localização</div>
            <div className="text-lg font-bold text-blue-600 hover:underline">{dados.localizacao.municipio}</div>
          </a>
        </div>

        {dados.refeicoes.length > 0 && (
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🍽️ Refeições Disponíveis</h2>
            <div className="space-y-3">
              {dados.refeicoes.map((refeicao) => (
                <div key={refeicao.id} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div className="font-medium text-gray-900 capitalize">
                    {refeicao.tipo_refeicao.replace('_', ' ')}
                  </div>
                  {refeicao.preco_extra && (
                    <div className="text-blue-600 font-bold">
                      +€{refeicao.preco_extra.toFixed(2)}/noite
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Endereço Completo</h2>
          <div className="space-y-3">
            <a
              href={googleMapsUrl || '#'}
              target={googleMapsUrl ? '_blank' : undefined}
              rel={googleMapsUrl ? 'noopener noreferrer' : undefined}
              className="text-gray-700 text-lg hover:text-blue-600 hover:underline cursor-pointer block"
            >
              {enderecoFormatado}
            </a>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                🗺️ Ver no Google Maps
              </a>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📞 Contactos</h2>
          <div className="space-y-2">
            {dados.telefone && (
              <div>
                <span className="text-gray-600">Telefone:</span>
                <a href={`tel:${dados.telefone}`} className="ml-2 text-blue-600 font-medium hover:underline">
                  {dados.telefone}
                </a>
              </div>
            )}
            {dados.email && (
              <div>
                <span className="text-gray-600">Email:</span>
                <a href={`mailto:${dados.email}`} className="ml-2 text-blue-600 font-medium hover:underline">
                  {dados.email}
                </a>
              </div>
            )}
            {dados.website && (
              <div>
                <span className="text-gray-600">Website:</span>
                <a
                  href={dados.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 font-medium hover:underline"
                >
                  {dados.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-4">
          <ReservaForm alojamento={dados} />
        </div>
      </div>
    </div>
  );
}

export default function AlojamentoDetalhePage({ params }: Props) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <a href="/alojamento" className="text-blue-600 hover:underline">
            ← Voltar aos alojamentos
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <Suspense fallback={<CarregandoDetalhe />}>
          <DetalheAlojamento id={id} />
        </Suspense>
      </div>
    </div>
  );
}
