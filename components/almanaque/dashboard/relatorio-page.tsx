"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface RelatorioCultura {
  id: number;
  nome: string;
  categoria: string;
  tipo_cultura: string;
  num_aptidoes: number;
  num_produtos: number;
  peso_total: number;
}

interface RelatorioPageProps {
  relatorioPorTipo: Array<{
    tipo: string;
    quantidade: number;
    culturas: RelatorioCultura[];
  }>;
  relatorioPorCategoria: Array<{
    categoria: string;
    quantidade: number;
    culturas: RelatorioCultura[];
  }>;
  relatorioAptidoes: Array<{
    aptidao: string;
    quantidade: number;
    culturas: string[];
  }>;
  relatorioProdutos: Array<{
    produto: string;
    quantidade: number;
    culturas: string[];
  }>;
}

type TabType = "tipo" | "categoria" | "aptidoes" | "produtos";

export function RelatorioPage({
  relatorioPorTipo,
  relatorioPorCategoria,
  relatorioAptidoes,
  relatorioProdutos,
}: RelatorioPageProps) {
  const [tabAtiva, setTabAtiva] = useState<TabType>("tipo");
  const [expandido, setExpandido] = useState<string | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "tipo", label: "Por Tipo", icon: "🌱" },
    { id: "categoria", label: "Por Categoria", icon: "📁" },
    { id: "aptidoes", label: "Aptidões", icon: "✨" },
    { id: "produtos", label: "Produtos", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Header */}
      <div className="bg-white border-b border-terra-200">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-terra-900 mb-2">
            Relatórios Detalhados
          </h1>
          <p className="text-terra-600">
            Análises completas das culturas por diferentes dimensões
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-terra-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTabAtiva(tab.id)}
                className={`px-6 py-4 font-medium transition whitespace-nowrap ${
                  tabAtiva === tab.id
                    ? "border-b-2 border-terra-600 text-terra-900"
                    : "text-terra-600 hover:text-terra-900"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Por Tipo */}
        {tabAtiva === "tipo" && (
          <div className="space-y-4">
            {relatorioPorTipo.map((item) => (
              <div
                key={item.tipo}
                className="bg-white rounded-lg border border-terra-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandido(
                      expandido === `tipo-${item.tipo}`
                        ? null
                        : `tipo-${item.tipo}`
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-terra-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-terra-900 text-lg">
                      {item.tipo}
                    </h3>
                    <p className="text-terra-600 text-sm">
                      {item.quantidade} culturas
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-terra-600">
                    {item.quantidade}
                  </span>
                </button>

                {expandido === `tipo-${item.tipo}` && (
                  <div className="border-t border-terra-200 px-6 py-4 bg-terra-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.culturas.map((cultura) => (
                        <div
                          key={cultura.id}
                          className="bg-white rounded-lg p-4 border border-terra-200"
                        >
                          <p className="font-medium text-terra-900">
                            {cultura.nome}
                          </p>
                          <p className="text-xs text-terra-600 mb-2">
                            {cultura.categoria}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {cultura.num_aptidoes} aptidões
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {cultura.num_produtos} produtos
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Por Categoria */}
        {tabAtiva === "categoria" && (
          <div className="space-y-4">
            {relatorioPorCategoria.map((item) => (
              <div
                key={item.categoria}
                className="bg-white rounded-lg border border-terra-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandido(
                      expandido === `cat-${item.categoria}`
                        ? null
                        : `cat-${item.categoria}`
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-terra-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-terra-900 text-lg">
                      {item.categoria}
                    </h3>
                    <p className="text-terra-600 text-sm">
                      {item.quantidade} culturas
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-terra-600">
                    {item.quantidade}
                  </span>
                </button>

                {expandido === `cat-${item.categoria}` && (
                  <div className="border-t border-terra-200 px-6 py-4 bg-terra-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.culturas.map((cultura) => (
                        <div
                          key={cultura.id}
                          className="bg-white rounded-lg p-4 border border-terra-200"
                        >
                          <p className="font-medium text-terra-900">
                            {cultura.nome}
                          </p>
                          <p className="text-xs text-terra-600 mb-2">
                            {cultura.tipo_cultura}
                          </p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {cultura.num_aptidoes} aptidões
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {cultura.num_produtos} produtos
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Aptidões */}
        {tabAtiva === "aptidoes" && (
          <div className="space-y-4">
            {relatorioAptidoes.map((item) => (
              <div
                key={item.aptidao}
                className="bg-white rounded-lg border border-terra-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandido(
                      expandido === `apt-${item.aptidao}`
                        ? null
                        : `apt-${item.aptidao}`
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-terra-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-terra-900 text-lg">
                      {item.aptidao}
                    </h3>
                    <p className="text-terra-600 text-sm">
                      {item.quantidade} culturas
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {item.quantidade}
                  </span>
                </button>

                {expandido === `apt-${item.aptidao}` && (
                  <div className="border-t border-terra-200 px-6 py-4 bg-terra-50">
                    <div className="flex flex-wrap gap-2">
                      {item.culturas.map((cultura) => (
                        <span
                          key={cultura}
                          className="bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-sm"
                        >
                          {cultura}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Produtos */}
        {tabAtiva === "produtos" && (
          <div className="space-y-4">
            {relatorioProdutos.map((item) => (
              <div
                key={item.produto}
                className="bg-white rounded-lg border border-terra-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandido(
                      expandido === `prod-${item.produto}`
                        ? null
                        : `prod-${item.produto}`
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-terra-50 transition"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-terra-900 text-lg">
                      {item.produto}
                    </h3>
                    <p className="text-terra-600 text-sm">
                      {item.quantidade} culturas
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {item.quantidade}
                  </span>
                </button>

                {expandido === `prod-${item.produto}` && (
                  <div className="border-t border-terra-200 px-6 py-4 bg-terra-50">
                    <div className="flex flex-wrap gap-2">
                      {item.culturas.map((cultura) => (
                        <span
                          key={cultura}
                          className="bg-green-100 text-green-900 px-3 py-1 rounded-full text-sm"
                        >
                          {cultura}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
