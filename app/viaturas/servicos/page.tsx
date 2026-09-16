import Link from "next/link";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { Wrench, Gauge, PackageSearch, ShieldCheck, Truck, Store, Sparkles, CarFront } from "lucide-react";

const categorias = [
  ["Oficinas e Mecânicos", "oficinas-mecanicos", "Oficina, mecânico, diagnóstico, eletrónica, motores, travões, suspensão, direção, híbridos, elétricos, revisões e restauro.", Wrench],
  ["Pneus", "pneus", "Loja de pneus, pneus novos e usados, montagem, reparação, furos, calibragem, equilibragem, alinhamento, geometria e jantes.", Gauge],
  ["Peças Auto", "pecas-auto", "Lojas de peças, peças novas, usadas e recondicionadas, baterias, óleos, filtros, travões, suspensão e acessórios.", PackageSearch],
  ["Vidros Automóvel", "vidros-automovel", "Quebra, reparação e substituição de vidros, para-brisas, vidros laterais, tetos panorâmicos e calibração ADAS.", ShieldCheck],
  ["Reboques e Assistência", "reboques-assistencia", "Reboques, pronto-socorro, assistência em viagem, desempanagem e transporte ou recuperação de viaturas.", Truck],
  ["Sucatas e Salvados", "sucatas-salvados", "Sucatas, centros de abate e desmantelamento, veículos para peças, salvados, recolha e reciclagem automóvel.", Store],
  ["Chapa e Pintura", "chapa-pintura", "Bate-chapas, chaparia, carroçaria, pintura, reparação de mossas e riscos e restauro de carroçaria.", Sparkles],
  ["Lavagem e Detalhe", "lavagem-detalhe", "Lavagem manual, limpeza interior, detalhe, polimento, proteção cerâmica, estofos e restauro de faróis.", Sparkles],
  ["Rent-a-Car e Com Motorista", "aluguer-transporte", "Aluguer por dia, transporte executivo, transfers, casamentos, cerimónias e motorista à hora ou ao dia.", CarFront],
] as const;

const subservicos = ["Calibragem de pneus", "Equilibragem de rodas", "Alinhamento de direção", "Peças usadas", "Reparar para-brisas", "Quebra de vidros", "Reboque", "Mecânico"];

export default function ViaturasServicosPage() {
  return <><ViaturasNavbar /><main className="min-h-screen bg-[#f5f7fb] px-4 py-8 sm:px-6"><div className="mx-auto max-w-7xl"><Link href="/viaturas" className="text-sm font-bold text-blue-700 hover:underline">← Voltar ao StandGo</Link><p className="mt-7 text-xs font-black uppercase tracking-[.18em] text-blue-600">StandGo</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Serviços Automóvel</h1><p className="mt-3 max-w-2xl text-slate-600">Encontra oficinas, pneus, peças, assistência e especialistas automóvel perto de ti.</p><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categorias.map(([nome, slug, descricao, Icon]) => <Link key={slug} href={`/viaturas/empresas?atividade=${slug}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"><Icon size={24} className="text-blue-600" aria-hidden="true" /><h2 className="mt-4 text-lg font-black text-slate-950 group-hover:text-blue-700">{nome}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{descricao}</p><span className="mt-4 block text-sm font-bold text-blue-700">Pesquisar empresas →</span></Link>)}</div><section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-xl font-black text-slate-950">Pesquisar um serviço específico</h2><div className="mt-4 flex flex-wrap gap-2">{subservicos.map((s) => <Link key={s} href={`/viaturas/empresas?q=${encodeURIComponent(s)}`} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">{s}</Link>)}</div><p className="mt-5 text-sm text-slate-500">Se ainda não houver empresas publicadas, a categoria continua disponível e mostra uma lista vazia.</p></section></div></main></>;
}
