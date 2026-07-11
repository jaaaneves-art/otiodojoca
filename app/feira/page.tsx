import { createClient } from "@/lib/supabase/server";
import { AdCard } from "@/components/marketplace/ad-card";
import { NewAdForm } from "@/components/marketplace/new-ad-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FeiraPage() {
  const supabase = createClient();

  const { data: ads } = await supabase
    .from("marketplace_ads")
    .select(`
      *,
      author:profiles(username)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-terra-800">Almanaque</Link>
            <span className="text-terra-300">/</span>
            <span className="text-terra-600">Feira da Terra</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/forum">Forum</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/perfil">Perfil</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Feira da Terra</h1>
        <p className="text-terra-600 mb-8">Compra, vende ou troca produtos locais.</p>

        {user ? (
          <div className="mb-8">
            <NewAdForm />
          </div>
        ) : (
          <div className="mb-8 p-4 bg-terra-100 rounded-lg text-center">
            <p className="text-terra-700">
              <Link href="/login" className="font-medium underline">Entra</Link>{" "}
              ou{" "}
              <Link href="/registo" className="font-medium underline">regista-te</Link>{" "}
              para criar um anuncio.
            </p>
          </div>
        )}

        <h2 className="text-lg font-semibold text-terra-800 mb-4">
          Anuncios ({ads?.length || 0})
        </h2>

        {ads && ads.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad as any} />
            ))}
          </div>
        ) : (
          <p className="text-terra-500 text-center py-12">
            Ainda nao ha anuncios. Se o primeiro a publicar!
          </p>
        )}
      </main>
    </div>
  );
}
