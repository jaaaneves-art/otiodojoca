import { DashboardMainPage } from "@/components/almanaque/dashboard/dashboard-main-page";
import { listarCulturas, calcularEstatisticas } from "@/lib/almanaque/queries";

export default async function AlmanaqueDashboardPage() {
  const culturas = await listarCulturas();
  const { stats, charts } = calcularEstatisticas(culturas);

  return <DashboardMainPage stats={stats} charts={charts} culturas={culturas} />;
}
