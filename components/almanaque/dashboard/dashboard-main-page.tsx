"use client";

import { DashboardStats } from "./dashboard-stats";
import { ChartDistribuicao } from "./chart-distribuicao";
import { ChartAptidoes } from "./chart-aptidoes";
import { ChartProdutos } from "./chart-produtos";
import { ExportCSV } from "./export-csv";

interface DashboardMainPageProps {
  stats: {
    totalCulturas: number;
    totalAptidoes: number;
    totalProdutos: number;
    tiposDistintos: number;
    culturasPorTipo: Record<string, number>;
    aptidoesDistintas: number;
    produtosDistintos: number;
  };
  charts: {
    distribuicao: Array<{
      tipo: string;
      quantidade: number;
    }>;
    aptidoes: Array<{
      aptidao: string;
      quantidade: number;
      culturas: number;
    }>;
    produtos: Array<{
      produto: string;
      quantidade: number;
      culturas: number;
    }>;
  };
  culturas: Array<{
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
    }>;
  }>;
}

export function DashboardMainPage({
  stats,
  charts,
  culturas,
}: DashboardMainPageProps) {
  // Tipo de cultura mais comum e a sua percentagem do total — calculado aqui
  // em vez de inline no JSX porque a versão inline tinha um parêntesis a
  // mais (bug de digitação) que impedia o build de compilar.
  const tipoMaisComumEntry = Object.entries(stats.culturasPorTipo).sort(
    ([, a], [, b]) => b - a
  )[0];
  const tipoMaisComumNome = tipoMaisComumEntry?.[0];
  const tipoMaisComumQtd = tipoMaisComumEntry?.[1] ?? 0;
  const tipoMaisComumPct =
    stats.totalCulturas > 0 ? (tipoMaisComumQtd / stats.totalCulturas) * 100 : 0;

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-terra-600 to-terra-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Dashboard de Culturas</h1>
          <p className="text-terra-100">
            Análise completa do banco de dados do Almanaque
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Estatísticas */}
        <section>
          <h2 className="text-2xl font-bold text-terra-900 mb-6">
            Resumo Executivo
          </h2>
          <DashboardStats {...stats} />
        </section>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section>
            <ChartDistribuicao dados={charts.distribuicao} />
          </section>
          <section>
            <ChartAptidoes dados={charts.aptidoes} />
          </section>
        </div>

        <section>
          <ChartProdutos dados={charts.produtos} />
        </section>

        {/* Exportação */}
        <section>
          <ExportCSV culturas={culturas} />
        </section>

        {/* Insights */}
        <section className="bg-white rounded-lg border border-terra-200 p-8">
          <h2 className="text-2xl font-bold text-terra-900 mb-6">
            Insights & Análises
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Insight 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
              <p className="text-blue-600 text-sm font-medium mb-2">
                Tipo Mais Comum
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {tipoMaisComumNome}
              </p>
              <p className="text-xs text-blue-700 mt-2">
                {tipoMaisComumQtd} culturas ({tipoMaisComumPct.toFixed(1)}%)
              </p>
            </div>

            {/* Insight 2 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
              <p className="text-purple-600 text-sm font-medium mb-2">
                Média de Aptidões
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {(stats.totalAptidoes / stats.totalCulturas).toFixed(1)}
              </p>
              <p className="text-xs text-purple-700 mt-2">
                por cultura
              </p>
            </div>

            {/* Insight 3 */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-l-4 border-green-500">
              <p className="text-green-600 text-sm font-medium mb-2">
                Média de Produtos
              </p>
              <p className="text-3xl font-bold text-green-900">
                {(stats.totalProdutos / stats.totalCulturas).toFixed(1)}
              </p>
              <p className="text-xs text-green-700 mt-2">
                por cultura
              </p>
            </div>
          </div>

          {/* Tabela de Distribuição */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-terra-900 mb-4">
              Distribuição por Tipo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-terra-200">
                    <th className="text-left py-3 px-4 font-bold text-terra-900">
                      Tipo
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-terra-900">
                      Quantidade
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-terra-900">
                      Percentual
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-terra-900">
                      Visualização
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.culturasPorTipo)
                    .sort(([, a], [, b]) => b - a)
                    .map(([tipo, qty]) => (
                      <tr key={tipo} className="border-b border-terra-100">
                        <td className="py-3 px-4 text-terra-900 font-medium">
                          {tipo}
                        </td>
                        <td className="py-3 px-4 text-terra-700">{qty}</td>
                        <td className="py-3 px-4 text-terra-700">
                          {((qty / stats.totalCulturas) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-terra-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-terra-600 h-full"
                              style={{
                                width: `${(qty / stats.totalCulturas) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
