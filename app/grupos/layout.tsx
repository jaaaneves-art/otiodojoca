import Link from "next/link";

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8">
    <nav className="flex gap-4" aria-label="Grupos"><Link href="/">Início</Link><Link href="/perfil">Perfil</Link><Link href="/mensagens">Mensagens privadas</Link><Link href="/grupos">Grupos</Link></nav>
    {children}
  </main>;
}
