import Link from "next/link";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { Building2 } from "lucide-react";
import { StandGoDirectory, type StandGoSearchParams } from "@/components/viaturas/standgo-directory";

const categorias = ["Stands", "Oficinas", "Mecânicos", "Rent-a-Car", "Com Motorista", "Pneus", "Peças Auto", "Vidros", "Sucatas", "Reboques", "Chapa/Pintura", "Lavagem/Detalhe"];

export default async function ViaturasEmpresasPage({ searchParams }: { searchParams: Promise<StandGoSearchParams> }) {
  const params = await searchParams;
  return <><ViaturasNavbar /><main className="min-h-screen bg-[#f5f7fb] px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl"><Link href="/viaturas" className="text-sm font-bold text-blue-700 hover:underline">← Voltar ao StandGo</Link><div className="mt-8 rounded-[2rem] border border-blue-100 bg-white p-6 sm:p-10"><Building2 size={32} className="text-blue-600" aria-hidden="true" /><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-blue-600">StandGo</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Empresas Automóvel</h1><p className="mt-3 max-w-2xl text-slate-600">Consulta empresas por atividade. A mesma empresa pode prestar vários serviços: oficina, pneus, peças, aluguer, assistência e muito mais.</p><div className="mt-7 flex flex-wrap gap-2">{categorias.map((categoria) => <Link key={categoria} href={`/viaturas/empresas?q=${encodeURIComponent(categoria)}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700">{categoria}</Link>)}</div></div><section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm sm:p-8"><StandGoDirectory params={params} title="Diretório público" description="Empresas automóvel publicadas no StandGo, filtradas por atividade e localização." basePath="/viaturas/empresas" /></section></div></main></>;
}
