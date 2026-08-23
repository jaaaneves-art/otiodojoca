"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CulturaDetailPageProps {
  cultura: {
    id: string;
    nome: string;
    categoria: string;
    descricao_cientifico?: string;
    tipo_cultura: string;
    subcategoria?: string;
    descricao_estendida?: string;
    aptidoes: Array<{
      id: string;
      aptidao: string;
      peso_importancia: number;
    }>;
    produtos: Array<{
      id: string;
      produto_nome: string;
      parte_usada?: string;
      peso_importancia: number;
    }>;
  };
  culturasSimilares?: Array<{
    id: string;
    nome: string;
    categoria: string;
    tipo_cultura: string;
  }>;
}

export function CulturaDetailPage({
  cultura,
  culturasSimilares = [],
}: CulturaDetailPageProps) {
  const tipoColors: Record<string, string> = {
    Anual: "bg-yellow-100 text-yellow-800",
    Perene: "bg-green-100 text-green-800",
    Arbórea: "bg-blue-100 text-blue-800",
    Arbustiva: "bg-purple-100 text-purple-800",
  };

  const tipoColor = tipoColors[cultura.tipo_cultura] || "bg-gray-100 text-gray-800";

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Header */}
      <div className="bg-white border-b border-terra-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/almanaque/culturas" className="text-terra-600 hover:text-terra-800 text-sm mb-4 block">
            ← Voltar ao Guia
          </Link>

          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-terra-900 mb-2">
                {cultura.nome}
              </h1>
              {cultura.descricao_cientifico && (
                <p className="text-lg text-terra-600 italic">
                  {cultura.descricao_cientifico}
                </p>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="outline">{cultura.categoria}</Badge>
                <Badge className={`${tipoColor}`}>{cultura.tipo_cultura}</Badge>
                {cultura.subcategoria && (
                  <Badge variant="secondary">{cultura.subcategoria}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Descrição Estendida */}
            {cultura.descricao_estendida && (
              <section className="bg-white rounded-lg border border-terra-200 p-6">
                <h2 className="text-2xl font-bold text-terra-900 mb-4">
                  Sobre
                </h2>
                <p className="text-terra-700 leading-relaxed">
                  {cultura.descricao_estendida}
                </p>
              </section>
            )}

            {/* Aptidões */}
            <section className="bg-white rounded-lg border border-terra-200 p-6">
              <h2 className="text-2xl font-bold text-terra-900 mb-4">
                Aptidões ({cultura.aptidoes.length})
              </h2>

              {cultura.aptidoes.length > 0 ? (
                <div className="space-y-3">
                  {cultura.aptidoes.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-terra-50 border border-terra-200"
                    >
                      <span className="font-medium text-terra-900">
                        {apt.aptidao}
                      </span>
                      {apt.peso_importancia > 1 && (
                        <span className="text-sm bg-terra-200 text-terra-800 px-3 py-1 rounded-full">
                          Primária ★
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-terra-500">Nenhuma aptidão registada</p>
              )}
            </section>

            {/* Produtos */}
            <section className="bg-white rounded-lg border border-terra-200 p-6">
              <h2 className="text-2xl font-bold text-terra-900 mb-4">
                Produtos ({cultura.produtos.length})
              </h2>

              {cultura.produtos.length > 0 ? (
                <div className="space-y-3">
                  {cultura.produtos.map((prod) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200"
                    >
                      <div>
                        <p className="font-medium text-green-900">
                          {prod.produto_nome}
                        </p>
                        {prod.parte_usada && (
                          <p className="text-sm text-green-700">
                            Parte usada: {prod.parte_usada}
                          </p>
                        )}
                      </div>
                      {prod.peso_importancia > 1 && (
                        <span className="text-sm bg-green-200 text-green-800 px-3 py-1 rounded-full">
                          Principal ★
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-terra-500">Nenhum produto registado</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-lg border border-terra-200 p-6">
              <h3 className="font-bold text-terra-900 mb-4">Informações</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-terra-600">Tipo</p>
                  <p className="font-medium text-terra-900">
                    {cultura.tipo_cultura}
                  </p>
                </div>
                <div>
                  <p className="text-terra-600">Categoria</p>
                  <p className="font-medium text-terra-900">
                    {cultura.categoria}
                  </p>
                </div>
                <div>
                  <p className="text-terra-600">Aptidões Totais</p>
                  <p className="font-medium text-terra-900">
                    {cultura.aptidoes.length}
                  </p>
                </div>
                <div>
                  <p className="text-terra-600">Produtos Totais</p>
                  <p className="font-medium text-terra-900">
                    {cultura.produtos.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Culturas Similares */}
            {culturasSimilares.length > 0 && (
              <div className="bg-white rounded-lg border border-terra-200 p-6">
                <h3 className="font-bold text-terra-900 mb-4">
                  Culturas Similares
                </h3>
                <div className="space-y-2">
                  {culturasSimilares.map((similar) => (
                    <Link
                      key={similar.id}
                      href={`/almanaque/culturas/${similar.id}`}
                      className="block p-2 rounded-lg hover:bg-terra-50 transition"
                    >
                      <p className="font-medium text-terra-900 text-sm">
                        {similar.nome}
                      </p>
                      <p className="text-xs text-terra-500">
                        {similar.categoria} • {similar.tipo_cultura}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <Link href="/almanaque/culturas">
              <Button className="w-full">
                Explorar Mais Culturas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
