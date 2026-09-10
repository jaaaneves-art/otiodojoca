import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ShoppingBag,
  Calendar,
  BookOpen,
  UtensilsCrossed,
  BedDouble,
  Bus,
  MapPin,
  Sprout,
  Moon,
  Briefcase,
  Ticket,
  Gavel,
  Building2,
  Recycle,
  Car,
  PawPrint,
  Flower2,
  Users,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-terra-800">O Tio do Joca</h1>
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/forum">Forum</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/mercado-da-terra">Mercado da Terra</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/grupos">
                  <Users className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/perfil">Perfil</Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/registo">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="text-center py-16">
          <h2 className="text-5xl font-bold text-terra-900 mb-4">
            O Tio do Joca
          </h2>
          <p className="text-xl text-terra-600 max-w-2xl mx-auto mb-8">
            A comunidade portuguesa que partilha conhecimento sobre hortas,
            jardins, animais e tradicoes da terra.
          </p>
          {user ? (
            <Button asChild size="lg">
              <Link href="/forum">Ir para o Forum</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/registo">Comecar agora — e gratis</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Forum"
            description="Pergunta, responde e partilha conhecimento sobre cultivo."
            href="/forum"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Mercado da Terra"
            description="Compra, vende ou troca produtos locais."
            href="/mercado-da-terra"
          />
          <FeatureCard
            icon={<UtensilsCrossed className="w-8 h-8" />}
            title="Comer"
            description="Descobre restaurantes e sabores da regiao."
            href="/comer"
          />
          <FeatureCard
            icon={<BedDouble className="w-8 h-8" />}
            title="Alojamento"
            description="Casas rurais, pousadas e sitios para pernoitar."
            href="/alojamento"
          />
          <FeatureCard
            icon={<MapPin className="w-8 h-8" />}
            title="Freguesias"
            description="Entidades, eventos e horarios de cada freguesia."
            href="/freguesias"
          />
          <FeatureCard
            icon={<Sprout className="w-8 h-8" />}
            title="Agenda Agricola"
            description="Planeia sementeiras e colheitas para a tua regiao."
            href="/agenda-agricola"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Almanaque"
            description="Guias de culturas e tradicoes da terra portuguesa."
            href="/almanaque"
          />
          <FeatureCard
            icon={<Moon className="w-8 h-8" />}
            title="Calendario Lunar"
            description="Fases da lua e tradicao para o trabalho agricola."
            href="/calendario"
          />
          <FeatureCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Empregos"
            description="Vagas e candidaturas ligadas ao mundo rural."
            href="/empregos"
          />
          <FeatureCard
            icon={<Ticket className="w-8 h-8" />}
            title="Espetaculos"
            description="Bilhetes para eventos e espetaculos na regiao."
            href="/espectaculos"
          />
          <FeatureCard
            icon={<Gavel className="w-8 h-8" />}
            title="Gran Bazar"
            description="Compra e venda por leilao de artigos diversos."
            href="/gran-bazar"
          />
          <FeatureCard
            icon={<Building2 className="w-8 h-8" />}
            title="Imoveis"
            description="Casas para venda ou leilao, incluindo quartos para estudantes."
            href="/imoveis"
          />
          <FeatureCard
            icon={<Recycle className="w-8 h-8" />}
            title="Lup"
            description="Doa, troca ou da nova vida a objetos usados."
            href="/lup"
          />
          <FeatureCard
            icon={<Car className="w-8 h-8" />}
            title="Viaturas"
            description="Carros e veiculos para venda, novos ou em leilao."
            href="/viaturas"
          />
          <FeatureCard
            icon={<PawPrint className="w-8 h-8" />}
            title="Mundo dos Patudos"
            description="Adocoes, casos e a comunidade de amigos dos animais."
            href="/mundo-dos-patudos"
          />
          <FeatureCard
            icon={<Flower2 className="w-8 h-8" />}
            title="Rua da Saudade"
            description="Um lugar digno para recordar quem ja partiu."
            href="/rua-da-saudade"
          />
          <FeatureCard
            icon={<Bus className="w-8 h-8" />}
            title="Viagens"
            description="Bilhetes de autocarro para a diaspora portuguesa na Europa."
            href="#"
            comingSoon
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  comingSoon?: boolean;
}) {
  return (
    <Link href={href} className={comingSoon ? "pointer-events-none" : ""}>
      <div className={`p-6 rounded-xl border bg-white ${comingSoon ? "opacity-60" : "hover:shadow-md transition-shadow"}`}>
        <div className="text-terra-600 mb-4">{icon}</div>
        <h3 className="font-semibold text-terra-800 mb-2 flex items-center gap-2">
          {title}
          {comingSoon && (
            <span className="text-xs bg-terra-100 text-terra-600 px-2 py-0.5 rounded-full">Brevemente</span>
          )}
        </h3>
        <p className="text-sm text-terra-500">{description}</p>
      </div>
    </Link>
  );
}
