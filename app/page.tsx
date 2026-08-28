import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingBag, Calendar, BookOpen, UtensilsCrossed, BedDouble, Bus, Sprout, Store, Landmark, Recycle, Car, Home } from "lucide-react";

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
                <Link href="/gran-bazar">Gran Bazar</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/lup">Lup</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/viaturas">StandGo</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/imoveis">Imóveis</Link>
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
            icon={<Store className="w-8 h-8" />}
            title="Gran Bazar"
            description="Vende, troca, oferece ou procura o que precisas."
            href="/gran-bazar"
          />
          <FeatureCard
            icon={<Recycle className="w-8 h-8" />}
            title="Lup"
            description="Doa ou recolhe excedentes — comida para pessoas, animais ou compostagem. Zero desperdício."
            href="/lup"
          />
          <FeatureCard
            icon={<Car className="w-8 h-8" />}
            title="StandGo"
            description="Compra, vende, aluga ou cede viaturas — venda direta, leilão ou aluguer."
            href="/viaturas"
          />
          <FeatureCard
            icon={<Home className="w-8 h-8" />}
            title="Imóveis"
            description="Compra, vende, arrenda, permuta ou troca por companhia — apartamentos, quartos, moradias, terrenos e mais."
            href="/imoveis"
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
            icon={<Bus className="w-8 h-8" />}
            title="Viagens"
            description="Bilhetes de autocarro para a diaspora portuguesa na Europa."
            href="#"
            comingSoon
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Calendario"
            description="Calendario agricola personalizado para a tua regiao."
            href="/calendario"
          />
          <FeatureCard
            icon={<Sprout className="w-8 h-8" />}
            title="Agenda Agricola"
            description="Regista as tuas plantacoes e acompanha o ciclo ate a colheita."
            href="/agenda-agricola"
          />
          <FeatureCard
            icon={<Landmark className="w-8 h-8" />}
            title="Entidades Parceiras"
            description="Juntas de Freguesia, Municipios, Associacoes e Cooperativas parceiras."
            href="/parceiros"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Almanaque"
            description="Calendario diario, culturas e sabedoria rural."
            href="/almanaque"
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
