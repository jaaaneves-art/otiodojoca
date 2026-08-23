"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartProdutosProps {
  dados: Array<{
    produto: string;
    quantidade: number;
    culturas: number;
  }>;
}

export function ChartProdutos({ dados }: ChartProdutosProps) {
  // Top 10
  const top10 = dados.slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-6">
      <h2 className="text-xl font-bold text-terra-900 mb-6">
        Top Produtos
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={top10}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="produto"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
            formatter={(value, name) => {
              if (name === "quantidade") return [`${value} vezes`, "Ocorrências"];
              if (name === "culturas") return [`${value} culturas`, "Culturas"];
              return value;
            }}
          />
          <Legend />
          <Bar dataKey="quantidade" fill="#10B981" name="Ocorrências" />
          <Bar dataKey="culturas" fill="#059669" name="Culturas" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-green-600 text-sm font-medium mb-2">
            Produto Mais Comum
          </p>
          <p className="text-2xl font-bold text-green-900">
            {dados[0]?.produto}
          </p>
          <p className="text-xs text-green-600">
            {dados[0]?.quantidade} ocorrências em {dados[0]?.culturas} culturas
          </p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-emerald-500">
          <p className="text-emerald-600 text-sm font-medium mb-2">
            Total Distintos
          </p>
          <p className="text-2xl font-bold text-emerald-900">{dados.length}</p>
          <p className="text-xs text-emerald-600">
            produtos registados no sistema
          </p>
        </div>
      </div>
    </div>
  );
}
