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

interface ChartAptidoesProps {
  dados: Array<{
    aptidao: string;
    quantidade: number;
    culturas: number;
  }>;
}

export function ChartAptidoes({ dados }: ChartAptidoesProps) {
  // Top 10
  const top10 = dados.slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-6">
      <h2 className="text-xl font-bold text-terra-900 mb-6">
        Top Aptidões
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={top10}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="aptidao"
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
          <Bar dataKey="quantidade" fill="#8B5CF6" name="Ocorrências" />
          <Bar dataKey="culturas" fill="#3B82F6" name="Culturas" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
          <p className="text-purple-600 text-sm font-medium mb-2">
            Mais Comum
          </p>
          <p className="text-2xl font-bold text-purple-900">
            {dados[0]?.aptidao}
          </p>
          <p className="text-xs text-purple-600">
            {dados[0]?.quantidade} ocorrências em {dados[0]?.culturas} culturas
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-blue-600 text-sm font-medium mb-2">
            Total Distintas
          </p>
          <p className="text-2xl font-bold text-blue-900">{dados.length}</p>
          <p className="text-xs text-blue-600">
            aptidões registadas no sistema
          </p>
        </div>
      </div>
    </div>
  );
}
