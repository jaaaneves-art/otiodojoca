import type { Metadata } from "next";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { StandGoDirectory, type StandGoSearchParams } from "@/components/viaturas/standgo-directory";

export const metadata: Metadata = {
  title: "Diretório de stands | StandGo",
  description:
    "Pesquisa stands e empresas automóvel verificadas da tua zona: venda, aluguer, oficinas, pneus, assistência e muito mais.",
};

export default async function DiretorioStandsPage({
  searchParams,
}: {
  searchParams: Promise<StandGoSearchParams>;
}) {
  const params = await searchParams;

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
          <StandGoDirectory
            params={params}
            description="Do stand de venda à oficina de confiança: encontra empresas automóvel ativas no StandGo, filtra por atividade e localização e abre a ficha pública de cada uma."
          />
        </main>
      </div>
    </>
  );
}
