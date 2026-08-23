import Link from "next/link";
import { CalendarDays, Sprout, BarChart3 } from "lucide-react";

export default function AlmanaquePage() {
  return (
    <div className="min-h-screen bg-terra-50">
      <div className="bg-gradient-to-r from-terra-600 to-terra-800 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Almanaque</h1>
          <p className="text-terra-100">
            Calendário, culturas e sabedoria rural do Tio do Joca.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <AlmanaqueCard
          icon={<CalendarDays className="w-8 h-8" />}
          title="Almanaque Diário"
          description="O dia de hoje: santo, fase da lua, efemérides e sabedoria popular."
          href="/calendario"
        />
        <AlmanaqueCard
          icon={<Sprout className="w-8 h-8" />}
          title="Guia de Culturas"
          description="Explora as culturas do Almanaque, as suas aptidões e produtos."
          href="/almanaque/culturas"
        />
        <AlmanaqueCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Dashboard"
          description="Estatísticas e análises sobre as culturas do Almanaque."
          href="/almanaque/dashboard"
        />
      </div>
    </div>
  );
}

function AlmanaqueCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="p-6 rounded-xl border border-terra-200 bg-white hover:shadow-md transition-shadow h-full">
        <div className="text-terra-600 mb-4">{icon}</div>
        <h3 className="font-semibold text-terra-800 mb-2">{title}</h3>
        <p className="text-sm text-terra-500">{description}</p>
      </div>
    </Link>
  );
}
