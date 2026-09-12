import type { Metadata } from "next";
import Link from "next/link";
import {
  BedDouble, BookOpen, BriefcaseBusiness, Bus, CalendarDays, Car,
  ChevronRight, Flower2, Globe2, Landmark, MapPin, MessageSquareText, MoonStar,
  PawPrint, Recycle, ShoppingBasket, Sprout, Store, Ticket,
  UtensilsCrossed, Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "O Tio do Joca | A comunidade da nossa terra",
  description: "Conhecimento agrícola, mercados locais, serviços e comunidade num só lugar.",
};

const otjLinks = [
  { title: "Fórum Agrícola", description: "Perguntas, respostas e saber partilhado.", href: "/forum", icon: MessageSquareText },
  { title: "Agenda Agrícola", description: "Acompanha plantações e colheitas.", href: "/agenda-agricola", icon: Sprout },
  { title: "Calendário Lunar", description: "Lua, meteorologia e tradição rural.", href: "/calendario", icon: MoonStar },
  { title: "Almanaque", description: "Culturas, calendário diário e sabedoria rural.", href: "/almanaque", icon: BookOpen },
];

const modules: Array<{ title: string; description: string; href: string; icon: LucideIcon; comingSoon?: boolean }> = [
  { title: "Rede Social", description: "Perfis, grupos, mensagens e comunidades locais num só lugar.", href: "/comunidade", icon: Users },
  { title: "Diáspora", description: "Portugueses, associações e negócios ligados às suas terras de origem.", href: "/diaspora", icon: Globe2 },
  { title: "Mercado da Terra", description: "Compra, vende ou troca produtos locais.", href: "/mercado-da-terra", icon: ShoppingBasket },
  { title: "Gran Bazar", description: "Vende, troca, oferece ou procura o que precisas.", href: "/gran-bazar", icon: Store },
  { title: "LUP", description: "Partilha excedentes e ajuda a reduzir o desperdício.", href: "/lup", icon: Recycle },
  { title: "StandGo", description: "Compra, vende, aluga ou cede viaturas.", href: "/viaturas", icon: Car },
  { title: "Imóveis", description: "Compra, venda, arrendamento e permuta de imóveis.", href: "/imoveis", icon: Landmark },
  { title: "Empregos", description: "Vagas, candidaturas e empresas da tua região.", href: "/empregos", icon: BriefcaseBusiness },
  { title: "Espetáculos", description: "Eventos, sessões, bilhetes e experiências ao vivo.", href: "/espectaculos", icon: Ticket },
  { title: "Comer", description: "Descobre restaurantes e sabores da região.", href: "/comer", icon: UtensilsCrossed },
  { title: "Alojamento", description: "Casas rurais, pousadas e sítios para pernoitar.", href: "/alojamento", icon: BedDouble },
  { title: "Freguesias", description: "Entidades, eventos e horários de cada freguesia.", href: "/freguesias", icon: MapPin },
  { title: "Entidades Parceiras", description: "Municípios, freguesias, associações e cooperativas.", href: "/parceiros", icon: CalendarDays },
  { title: "Mundo dos Patudos", description: "Adoções, casos e a comunidade de amigos dos animais.", href: "/mundo-dos-patudos", icon: PawPrint },
  { title: "Rua da Saudade", description: "Um lugar digno para recordar quem já partiu.", href: "/rua-da-saudade", icon: Flower2 },
  { title: "Viagens", description: "Ligações para a comunidade portuguesa na Europa.", href: "#", icon: Bus, comingSoon: true },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbf2_0%,#f4f1e9_42%,#fff_100%)] text-terra-900">
      <header className="border-b border-terra-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="O Tio do Joca — início">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-terra-800 text-sm font-black tracking-tight text-white shadow-lg shadow-terra-900/15">OTJ</span>
            <span className="truncate text-lg font-black tracking-tight text-terra-900 sm:text-xl">O Tio do Joca</span>
          </Link>

          <nav className="flex shrink-0 items-center gap-2" aria-label="Conta">
            {user ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/mensagens">Mensagens</Link></Button>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/grupos" aria-label="Grupos" title="Grupos"><Users className="h-4 w-4" aria-hidden="true" /></Link></Button>
                <Button asChild size="sm"><Link href="/perfil">Perfil</Link></Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm"><Link href="/login">Entrar</Link></Button>
                <Button asChild size="sm"><Link href="/registo">Criar conta</Link></Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <section className="mb-10 max-w-3xl sm:mb-12" aria-labelledby="home-title">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-terra-600">A comunidade da nossa terra</p>
          <h1 id="home-title" className="text-4xl font-black leading-[1.08] tracking-[-0.035em] text-terra-900 sm:text-5xl lg:text-6xl">
            Tudo o que nos liga,<span className="block text-terra-700">num só lugar.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-terra-700">
            Conhecimento agrícola, mercados locais, serviços e encontros para quem vive Portugal cá dentro e lá fora.
          </p>
        </section>

        <section className="mb-12" aria-labelledby="otj-title">
          <div className="overflow-hidden rounded-[2rem] border border-emerald-800/15 bg-emerald-950 text-white shadow-[0_24px_70px_rgba(20,83,45,0.18)]">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.68fr_1.32fr] lg:items-center lg:p-10">
              <div>
                <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-lime-300 text-base font-black text-emerald-950 shadow-lg shadow-black/15">OTJ</span>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-lime-200">Saber da comunidade</p>
                <h2 id="otj-title" className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">O Tio do Joca</h2>
                <p className="mt-3 max-w-md text-base leading-7 text-emerald-100">
                  O espaço onde o conhecimento agrícola, a experiência e o ritmo da natureza se encontram.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {otjLinks.map(({ title, description, href, icon: Icon }) => (
                  <Link key={href} href={href} className="group flex min-h-32 items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.08] p-4 transition hover:-translate-y-0.5 hover:border-lime-200/40 hover:bg-white/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-300 text-emerald-950"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="flex items-center justify-between gap-2 font-extrabold text-white">{title}<ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                      <span className="mt-1.5 block text-sm leading-6 text-emerald-100">{description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="explorar-title">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-terra-500">Comunidade e serviços</p>
            <h2 id="explorar-title" className="mt-1 text-2xl font-black tracking-tight text-terra-900 sm:text-3xl">Explorar O Tio do Joca</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => <ModuleCard key={module.title} {...module} />)}
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t border-terra-200 bg-white/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-terra-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-bold text-terra-800">O Tio do Joca</span><span>Feito para a comunidade portuguesa.</span>
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({ title, description, href, icon: Icon, comingSoon = false }: {
  title: string; description: string; href: string; icon: LucideIcon; comingSoon?: boolean;
}) {
  const content = (
    <>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-terra-100 text-terra-700 transition group-hover:bg-terra-700 group-hover:text-white"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <span className="mt-5 flex items-center justify-between gap-3">
        <span className="text-lg font-extrabold text-terra-900">{title}</span>
        {comingSoon ? <span className="rounded-full bg-terra-100 px-2.5 py-1 text-xs font-bold text-terra-600">Brevemente</span> : <ChevronRight className="h-5 w-5 text-terra-400 transition-transform group-hover:translate-x-1 group-hover:text-terra-700" aria-hidden="true" />}
      </span>
      <span className="mt-2 block text-sm leading-6 text-terra-600">{description}</span>
    </>
  );

  if (comingSoon) return <div className="group rounded-2xl border border-terra-200 bg-white/60 p-5 opacity-70" aria-disabled="true">{content}</div>;

  return <Link href={href} className="group rounded-2xl border border-terra-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-terra-300 hover:shadow-xl hover:shadow-terra-900/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-600">{content}</Link>;
}
