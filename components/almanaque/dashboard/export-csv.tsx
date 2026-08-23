"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportCSVProps {
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

export function ExportCSV({ culturas }: ExportCSVProps) {
  const handleExportCSV = () => {
    // Preparar dados
    const rows: string[] = [];

    // Header
    rows.push(
      "ID,Nome,Categoria,Tipo Cultura,Descrição Científica,Aptidões,Produtos"
    );

    // Dados
    culturas.forEach((cultura) => {
      const aptidoesStr = cultura.aptidoes
        .map((a) => a.aptidao)
        .join("; ");
      const produtosStr = cultura.produtos
        .map((p) => p.produto_nome)
        .join("; ");

      const row = [
        cultura.id,
        `"${cultura.nome}"`,
        `"${cultura.categoria}"`,
        `"${cultura.tipo_cultura}"`,
        `"${cultura.descricao_cientifico || ""}"`,
        `"${aptidoesStr}"`,
        `"${produtosStr}"`,
      ].join(",");

      rows.push(row);
    });

    // Criar blob
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `culturas_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(culturas, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `culturas_${new Date().toISOString().split("T")[0]}.json`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg border border-terra-200 p-6">
      <h2 className="text-xl font-bold text-terra-900 mb-4">
        Exportar Dados
      </h2>

      <p className="text-terra-600 text-sm mb-6">
        Exporte os dados das culturas em diferentes formatos para análise ou
        integração com outros sistemas.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition"
        >
          <Download size={18} />
          Exportar CSV ({culturas.length} culturas)
        </button>

        <button
          onClick={handleExportJSON}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition"
        >
          <Download size={18} />
          Exportar JSON ({culturas.length} culturas)
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
          <p className="font-medium text-green-900 mb-1">CSV</p>
          <p className="text-green-700">
            Formato de texto simples, compatível com Excel e Google Sheets
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="font-medium text-blue-900 mb-1">JSON</p>
          <p className="text-blue-700">
            Formato estruturado, ideal para integração com APIs
          </p>
        </div>
      </div>
    </div>
  );
}
