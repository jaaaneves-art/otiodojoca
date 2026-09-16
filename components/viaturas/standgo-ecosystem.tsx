import Link from "next/link";
import {
  CarFront,
  CircleDollarSign,
  Gauge,
  MapPin,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

const viaturas = [
  ["Comprar", "/viaturas?type=venda", CarFront],
  ["Vender", "/viaturas/novo", CircleDollarSign],
  ["Leilões", "/viaturas/leiloes", Gauge],
  ["Procuro viatura", "/viaturas?type=comprar", MapPin],
  ["Rent-a-Car", "/viaturas?type=alugar", CarFront],
  ["Com Motorista", "/viaturas?type=com_motorista", ShieldCheck],
] as const;

const servicos = [
  ["Oficinas e Mecânicos", "oficinas-mecanicos", Wrench],
  ["Pneus", "pneus", Gauge],
  ["Peças Auto", "pecas-auto", PackageSearch],
  ["Vidros Automóvel", "vidros-automovel", ShieldCheck],
  ["Reboques / Assistência", "reboques-assistencia", Truck],
  ["Sucatas e Salvados", "sucatas-salvados", Store],
  ["Chapa e Pintura", "chapa-pintura", Sparkles],
  ["Lavagem / Detalhe", "lavagem-detalhe", Sparkles],
] as const;

function Card({ href, label, Icon }: { href: string; label: string; Icon: typeof CarFront }) {
  return (
    <Link href={href} className="group flex min-h-24 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <Icon size={21} className="text-blue-600" aria-hidden="true" />
      <span className="mt-3 text-sm font-extrabold text-slate-900 group-hover:text-blue-700">{label}</span>
    </Link>
  );
}

export function StandGoEcosystem() {
  return (
    <section aria-labelledby="standgo-ecossistema" className="mb-8 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-8">
      <div className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-[.18em] text-blue-600">StandGo</p>
        <h1 id="standgo-ecossistema" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">O que procuras?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Viaturas, empresas e serviços automóvel num só lugar.</p>
      </div>

      <div className="mt-7">
        <h2 className="text-sm font-black uppercase tracking-[.14em] text-slate-700">Viaturas</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {viaturas.map(([label, href, Icon]) => <Card key={label} label={label} href={href} Icon={Icon} />)}
        </div>
      </div>

      <div className="mt-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-[.14em] text-slate-700">Serviços automóvel</h2>
          <Link href="/viaturas/servicos" className="text-sm font-bold text-blue-700 hover:underline">Ver todos os serviços →</Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {servicos.map(([label, slug, Icon]) => <Card key={slug} label={label} href={`/viaturas/servicos?categoria=${slug}`} Icon={Icon} />)}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Serviços mais procurados">
          {["Alinhamento de direção", "Equilibragem de rodas", "Calibragem de pneus", "Peças usadas", "Reparar para-brisas", "Quebra de vidros"].map((servico) => (
            <Link key={servico} href={`/viaturas/empresas?q=${encodeURIComponent(servico)}`} className="rounded-full border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-800 hover:border-blue-400 hover:bg-blue-50">{servico}</Link>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/viaturas/empresas" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white hover:bg-slate-800"><Store size={17} aria-hidden="true" /> Empresas Automóvel</Link>
        <Link href="/eventos-festas/aderir" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-extrabold text-slate-800 hover:border-blue-400">Adicionar a minha empresa</Link>
      </div>
    </section>
  );
}
