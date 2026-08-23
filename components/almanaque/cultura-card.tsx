"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CulturaCardProps {
  id: string;
  nome: string;
  categoria: string;
  tipo_cultura: string;
  descricao_cientifico?: string;
  aptidoes: Array<{
    aptidao: string;
    peso_importancia: number;
  }>;
  produtos: Array<{
    produto_nome: string;
    parte_usada?: string;
    peso_importancia: number;
  }>;
}

export function CulturaCard({
  id,
  nome,
  categoria,
  tipo_cultura,
  descricao_cientifico,
  aptidoes,
  produtos,
}: CulturaCardProps) {
  // Cores por tipo_cultura
  const tipoColors: Record<string, string> = {
    Anual: "bg-yellow-100 text-yellow-800",
    Perene: "bg-green-100 text-green-800",
    Arbórea: "bg-blue-100 text-blue-800",
    Arbustiva: "bg-purple-100 text-purple-800",
  };

  const tipoColor = tipoColors[tipo_cultura] || "bg-gray-100 text-gray-800";

  return (
    <Link href={`/almanaque/culturas/${id}`}>
      <div className="bg-white rounded-lg border border-terra-200 hover:shadow-lg transition overflow-hidden cursor-pointer h-full flex flex-col">
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-terra-50 to-terra-100 p-4 border-b border-terra-200">
          <h3 className="font-bold text-lg text-terra-900">{nome}</h3>
          {descricao_cientifico && (
            <p className="text-sm text-terra-600 italic">{descricao_cientifico}</p>
          )}
        </div>

        {/* Corpo */}
        <div className="p-4 flex-1 flex flex-col gap-3">
          {/* Categoria e Tipo */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {categoria}
            </Badge>
            <Badge className={`text-xs ${tipoColor}`}>{tipo_cultura}</Badge>
          </div>

          {/* Aptidões */}
          {aptidoes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-terra-700 mb-2">
                Aptidões ({aptidoes.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {aptidoes.map((apt, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-terra-100"
                  >
                    {apt.aptidao}
                    {apt.peso_importancia > 1 && (
                      <span className="ml-1 font-bold">★</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Produtos */}
          {produtos.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-terra-700 mb-2">
                Produtos ({produtos.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {produtos.map((prod, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                  >
                    {prod.produto_nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-terra-50 px-4 py-3 border-t border-terra-200 text-center">
          <p className="text-xs font-medium text-terra-600 hover:text-terra-900">
            Ver detalhes →
          </p>
        </div>
      </div>
    </Link>
  );
}
