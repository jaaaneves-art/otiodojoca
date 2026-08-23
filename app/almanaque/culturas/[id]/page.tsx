import { notFound } from "next/navigation";
import { CulturaDetailPage } from "@/components/almanaque/cultura-detail-page";
import { obterCultura } from "@/lib/almanaque/queries";

export default async function AlmanaqueCulturaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resultado = await obterCultura(id);

  if (!resultado) {
    notFound();
  }

  return (
    <CulturaDetailPage
      cultura={resultado.cultura}
      culturasSimilares={resultado.culturasSimilares}
    />
  );
}
