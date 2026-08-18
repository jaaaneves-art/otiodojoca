/**
 * Componente: CartaoAlmanaque
 * Exibe informações do dia do Almanaque Diário
 * Projeto: O Tio do Joca
 */

'use client';

import { useAlmanaque } from '@/lib/calendario/useAlmanaque';
import type { AlmanaqueDia } from '@/lib/calendario/tipos-almanaque';

interface CartaoAlmanaqueProps {
  data?: Date | string;
  className?: string;
}

export function CartaoAlmanaque({ data, className = '' }: CartaoAlmanaqueProps) {
  const almanaqueDia = useAlmanaque(data);

  if (!almanaqueDia) {
    return (
      <div className={`rounded-lg border border-terra-200 bg-terra-50 p-4 ${className}`}>
        <p className="text-terra-600">Sem dados do almanaque para este dia.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-terra-200 bg-white shadow-sm ${className}`}>
      {/* Santo do Dia */}
      {almanaqueDia.santo_do_dia && (
        <div className="border-b border-terra-100 px-4 py-3">
          <h3 className="text-xs font-semibold text-terra-600 uppercase tracking-wide">
            Santo do Dia
          </h3>
          <p className="mt-1 text-terra-900">{almanaqueDia.santo_do_dia}</p>
        </div>
      )}

      {/* Efemérides */}
      {almanaqueDia.efemerides && (
        <div className="border-b border-terra-100 px-4 py-3">
          <h3 className="text-xs font-semibold text-terra-600 uppercase tracking-wide">
            Efemérides
          </h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
            {almanaqueDia.efemerides}
          </p>
        </div>
      )}

      {/* Provérbio */}
      {almanaqueDia.proverbio && (
        <div className="border-b border-terra-100 bg-terra-50 px-4 py-3">
          <p className="italic text-terra-800">"{almanaqueDia.proverbio}"</p>
        </div>
      )}

      {/* Seções principais */}
      <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
        {/* Agricultura */}
        {almanaqueDia.agricultura && (
          <div className="border-r border-terra-100 border-b border-terra-100 px-4 py-3 md:border-b-0">
            <h4 className="text-xs font-semibold text-terra-600 uppercase">Agricultura</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
              {almanaqueDia.agricultura}
            </p>
          </div>
        )}

        {/* Horta e Jardim */}
        {almanaqueDia.horta_e_jardim && (
          <div className="border-b border-terra-100 px-4 py-3 md:border-b-0">
            <h4 className="text-xs font-semibold text-terra-600 uppercase">Horta & Jardim</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
              {almanaqueDia.horta_e_jardim}
            </p>
          </div>
        )}

        {/* Natureza */}
        {almanaqueDia.natureza && (
          <div className="border-r border-terra-100 border-b border-terra-100 px-4 py-3 md:border-b-0">
            <h4 className="text-xs font-semibold text-terra-600 uppercase">Natureza</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
              {almanaqueDia.natureza}
            </p>
          </div>
        )}

        {/* Astronomia */}
        {almanaqueDia.astronomia && (
          <div className="border-b border-terra-100 px-4 py-3 md:border-b-0">
            <h4 className="text-xs font-semibold text-terra-600 uppercase">Astronomia</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
              {almanaqueDia.astronomia}
            </p>
          </div>
        )}
      </div>

      {/* Curiosidade */}
      {almanaqueDia.curiosidade && (
        <div className="border-t border-terra-100 bg-terra-50 px-4 py-3">
          <h4 className="text-xs font-semibold text-terra-600 uppercase">Curiosidade</h4>
          <p className="mt-1 whitespace-pre-wrap text-sm text-terra-700">
            {almanaqueDia.curiosidade}
          </p>
        </div>
      )}
    </div>
  );
}

export default CartaoAlmanaque;
