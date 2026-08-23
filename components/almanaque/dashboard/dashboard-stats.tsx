"use client";

import { TrendingUp, Leaf, Flower, Zap } from "lucide-react";

interface DashboardStatsProps {
  totalCulturas: number;
  totalAptidoes: number;
  totalProdutos: number;
  tiposDistintos: number;
  culturasPorTipo: Record<string, number>;
  aptidoesDistintas: number;
  produtosDistintos: number;
}

export function DashboardStats({
  totalCulturas,
  totalAptidoes,
  totalProdutos,
  tiposDistintos,
  culturasPorTipo,
  aptidoesDistintas,
  produtosDistintos,
}: DashboardStatsProps) {
  const stats = [
    {
      title: "Total de Culturas",
      value: totalCulturas,
      icon: Leaf,
      color: "bg-green-500",
      trend: "+72 registados",
    },
    {
      title: "Tipos de Cultura",
      value: tiposDistintos,
      icon: TrendingUp,
      color: "bg-blue-500",
      details: `Anual: ${culturasPorTipo["Anual"] || 0}, Perene: ${culturasPorTipo["Perene"] || 0}, Arbórea: ${culturasPorTipo["Arbórea"] || 0}, Arbustiva: ${culturasPorTipo["Arbustiva"] || 0}`,
    },
    {
      title: "Aptidões",
      value: totalAptidoes,
      icon: Flower,
      color: "bg-purple-500",
      secondary: `${aptidoesDistintas} distintas`,
    },
    {
      title: "Produtos",
      value: totalProdutos,
      icon: Zap,
      color: "bg-orange-500",
      secondary: `${produtosDistintos} distintos`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-lg border border-terra-200 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-terra-600 text-sm font-medium mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-terra-900 mb-2">
                  {stat.value}
                </p>
                {stat.trend && (
                  <p className="text-xs text-green-600">{stat.trend}</p>
                )}
                {stat.details && (
                  <p className="text-xs text-terra-500 mt-2 line-clamp-2">
                    {stat.details}
                  </p>
                )}
                {stat.secondary && (
                  <p className="text-xs text-terra-600">{stat.secondary}</p>
                )}
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                <Icon size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
