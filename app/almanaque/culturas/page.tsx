import { CulturasPage } from "@/components/almanaque/culturas-page";
import { listarCulturas, listarCategorias } from "@/lib/almanaque/queries";

export default async function AlmanaqueCulturasPage() {
  const [culturas, categorias] = await Promise.all([listarCulturas(), listarCategorias()]);

  return <CulturasPage culturas={culturas} categorias={categorias} />;
}
