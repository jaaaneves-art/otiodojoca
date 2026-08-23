"use client";

import { useState, useMemo } from "react";
import { CulturaCard } from "./cultura-card";

interface Cultura {
  id: string;
  nome: string;
  categoria: string;
  category_id: number;
  descricao_cientifico?: string;
  tipo_cultura: string;
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

interface CulturaListProps {
  culturas: Cultura[];
  filters: {
    searchTerm: string;
    tipo_cultura: string[];
    category_id: number[];
    aptidao: string;
    produto: string;
  };
  sortBy?: "nome" | "tipo" | "aptidoes";
}

export function CulturasList({
  culturas,
  filters,
  sortBy = "nome",
}: CulturaListProps) {
  const [itemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  // Aplicar filtros
  const filteredCulturas = useMemo(() => {
    return culturas.filter((cultura) => {
      // Search term (nome ou descrição científica)
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        if (
          !cultura.nome.toLowerCase().includes(term) &&
          !(
            cultura.descricao_cientifico &&
            cultura.descricao_cientifico.toLowerCase().includes(term)
          )
        ) {
          return false;
        }
      }

      // Tipo de cultura
      if (
        filters.tipo_cultura.length > 0 &&
        !filters.tipo_cultura.includes(cultura.tipo_cultura)
      ) {
        return false;
      }

      // Categoria
      if (
        filters.category_id.length > 0 &&
        !filters.category_id.includes(cultura.category_id)
      ) {
        return false;
      }

      // Aptidão
      if (filters.aptidao) {
        const term = filters.aptidao.toLowerCase();
        if (
          !cultura.aptidoes.some((apt) =>
            apt.aptidao.toLowerCase().includes(term)
          )
        ) {
          return false;
        }
      }

      // Produto
      if (filters.produto) {
        const term = filters.produto.toLowerCase();
        if (
          !cultura.produtos.some((prod) =>
            prod.produto_nome.toLowerCase().includes(term)
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [culturas, filters]);

  // Ordenar
  const sortedCulturas = useMemo(() => {
    const sorted = [...filteredCulturas];

    switch (sortBy) {
      case "tipo":
        sorted.sort((a, b) => a.tipo_cultura.localeCompare(b.tipo_cultura));
        break;
      case "aptidoes":
        sorted.sort((a, b) => b.aptidoes.length - a.aptidoes.length);
        break;
      case "nome":
      default:
        sorted.sort((a, b) => a.nome.localeCompare(b.nome));
    }

    return sorted;
  }, [filteredCulturas, sortBy]);

  // Paginação
  const totalPages = Math.ceil(sortedCulturas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCulturas = sortedCulturas.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page quando filtros mudam
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (sortedCulturas.length === 0) {
    return (
      <div className="col-span-3 flex flex-col items-center justify-center py-12 text-center">
        <p className="text-terra-600 text-lg font-medium mb-2">
          Nenhuma cultura encontrada
        </p>
        <p className="text-terra-500 text-sm">
          Tente ajustar seus filtros
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-terra-600">
          Mostrando <span className="font-bold">{paginatedCulturas.length}</span> de{" "}
          <span className="font-bold">{sortedCulturas.length}</span> culturas
          {filters.searchTerm && (
            <span className="ml-2 text-terra-500">
              (procura: "{filters.searchTerm}")
            </span>
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCulturas.map((cultura) => (
          <CulturaCard
            key={cultura.id}
            id={cultura.id}
            nome={cultura.nome}
            categoria={cultura.categoria}
            tipo_cultura={cultura.tipo_cultura}
            descricao_cientifico={cultura.descricao_cientifico}
            aptidoes={cultura.aptidoes}
            produtos={cultura.produtos}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-terra-200 text-sm font-medium disabled:opacity-50 hover:bg-terra-50"
          >
            Anterior
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                  currentPage === page
                    ? "bg-terra-500 text-white"
                    : "border border-terra-200 hover:bg-terra-50"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-terra-200 text-sm font-medium disabled:opacity-50 hover:bg-terra-50"
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
