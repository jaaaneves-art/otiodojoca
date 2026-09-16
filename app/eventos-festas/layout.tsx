import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: { default: 'Eventos & Festas | OTJ', template: '%s | Eventos & Festas · OTJ' }, description: 'Encontre espaços e profissionais para casamentos, festas e eventos, em Portugal e na Diáspora.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-50 text-terra-900">
    <header className="border-b border-rose-100 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Link href="/eventos-festas" className="flex items-center gap-2 text-lg font-bold"><Sparkles className="text-rose-700" aria-hidden="true" />Eventos & Festas <span className="text-xs font-normal">OTJ</span></Link>
      <nav aria-label="Eventos e Festas" className="flex flex-wrap gap-x-5 gap-y-3 text-sm"><Link href="/eventos-festas/empresas">Profissionais</Link><Link href="/eventos-festas/servicos">Serviços</Link><Link href="/eventos-festas/painel">A minha empresa</Link><Link href="/">OTJ</Link></nav>
    </div></header>
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
    <footer className="mx-auto max-w-6xl border-t border-rose-100 px-4 py-8 text-sm text-stone-600">Empresas e profissionais para celebrar, em Portugal e pelo mundo. <Link href="/espectaculos" className="underline">Procurar espetáculos e bilhetes</Link></footer>
  </div>;
}
