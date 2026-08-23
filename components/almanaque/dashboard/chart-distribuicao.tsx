"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ChartDistribuicaoProps {
  dados: Array<{
    tipo: string;
    quantidade: number;
  }>;
}

export function ChartDistribuicao({ dados }: ChartDistribuicaoProps) {
  const COLORS = {
    Anual: "#FBBF24",
    Perene: "#34D399",
    Arbórea: "#3B82F6",
    Arbustiva: "#A78BFA",
  };

  const dataFormatada = dados.map((d) => ({
    name: d.tipo,
    value: d.quantidade,
  }));

  const total = dados.reduce((sum, d) => sum + d.quantidade, 0);

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-6">
      <h2 className="text-xl font-bold text-terra-900 mb-6">
        Distribuição por Tipo de Cultura
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataFormatada}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {dataFormatada.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as keyof typeof COLORS] || "#9CA3AF"}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${value} culturas`, "Quantidade"]}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {dados.map((d) => (
          <div
            key={d.tipo}
            className="bg-terra-50 rounded-lg p-4 text-center border-l-4"
            style={{
              borderColor: COLORS[d.tipo as keyof typeof COLORS] || "#9CA3AF",
            }}
          >
            <p className="text-terra-600 text-sm font-medium">{d.tipo}</p>
            <p className="text-2xl font-bold text-terra-900">{d.quantidade}</p>
            <p className="text-xs text-terra-500">
              {((d.quantidade / total) * 100).toFixed(1)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
