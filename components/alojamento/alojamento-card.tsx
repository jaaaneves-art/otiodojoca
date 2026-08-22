// components/alojamento/alojamento-card.tsx

'use client';

import Link from 'next/link';
import type { Alojamento } from '@/lib/alojamento/tipos';

interface AlojamentoCardProps {
  alojamento: Alojamento;
}

export default function AlojamentoCard({ alojamento }: AlojamentoCardProps) {
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
    <Link href={`/alojamento/${alojamento.id}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
        {/* Cabeçalho com tipo e rating */}
        <div className="bg-blue-50 p-4 border-b">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              {tiposMap[alojamento.tipo] || alojamento.tipo}
            </span>
            {alojamento.rating && (
              <div className="text-sm font-semibold text-yellow-600">
                ⭐ {alojamento.rating.toFixed(1)}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{alojamento.nome}</h3>

          {alojamento.localizacao && (
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
              <span>📍</span>
              <span>
                {[
                  alojamento.localizacao.localidade,
                  alojamento.localizacao.municipio,
                  alojamento.localizacao.codigo_postal,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Localização não disponível'}
              </span>
            </div>
          )}

          {alojamento.descricao && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{alojamento.descricao}</p>
          )}

          {/* Informações */}
          <div className="space-y-2 mb-4 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛏️</span>
              <span>
                {alojamento.num_quartos} quarto{alojamento.num_quartos > 1 ? 's' : ''}
                {alojamento.num_camas && ` • ${alojamento.num_camas} cama${alojamento.num_camas > 1 ? 's' : ''}`}
              </span>
            </div>
          </div>

          {/* Preço */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div className="text-2xl font-bold text-blue-600">
              €{alojamento.preco_noite.toFixed(2)}
            </div>
            <span className="text-xs text-gray-500">por noite</span>
          </div>

          {/* Contactos */}
          {(alojamento.telefone || alojamento.email) && (
            <div className="mt-3 pt-3 border-t text-xs text-gray-500">
              {alojamento.telefone && <div>📞 {alojamento.telefone}</div>}
              {alojamento.email && <div>📧 {alojamento.email}</div>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
