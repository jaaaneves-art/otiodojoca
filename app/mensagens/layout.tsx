import Link from "next/link";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8">
    <nav className="flex gap-4" aria-label="Mensagens"><Link href="/">Início</Link><Link href="/perfil">Perfil</Link><Link href="/mensagens">Mensagens privadas</Link></nav>
    {children}
  </main>;
}
