import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: ad } = await supabase
    .from("marketplace_ads")
    .select(`
      *,
      author:profiles(username, location)
    `)
    .eq("id", Number(params.id))
    .single();

  if (!ad) {
    return <div className="p-8 text-center">Anuncio nao encontrado</div>;
  }

  const priceLabel = {
    fixed: `${ad.price?.toFixed(2)} €`,
    negotiable: `${ad.price?.toFixed(2)} € (negociavel)`,
    free: "Gratis",
  };

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/feira" className="text-terra-600 hover:text-terra-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-terra-800">Anuncio</h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/perfil">Perfil</Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-terra-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-terra-900">{ad.title}</h2>
            <span className={`text-sm px-3 py-1 rounded-full ${
              ad.status === 'active' ? 'bg-green-100 text-green-700' :
              ad.status === 'sold' ? 'bg-gray-100 text-gray-600' :
              'bg-terra-100 text-terra-600'
            }`}>
              {ad.status === 'active' ? 'Ativo' :
               ad.status === 'sold' ? 'Vendido' :
               ad.status === 'reserved' ? 'Reservado' : 'Expirado'}
            </span>
          </div>

          <p className="text-3xl font-bold text-terra-600 mb-4">
            {priceLabel[ad.price_type as keyof typeof priceLabel] || "Preco sob consulta"}
          </p>

          {ad.description && (
            <p className="text-terra-700 mb-6 whitespace-pre-wrap">{ad.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-terra-500">Localizacao</p>
              <p className="font-medium">{ad.location || "Nao especificada"}</p>
            </div>
            <div>
              <p className="text-terra-500">Contacto</p>
              <p className="font-medium">
                {ad.contact_method === 'message' ? 'Mensagem privada' :
                 ad.contact_method === 'phone' ? 'Telefone' : 'Email'}
              </p>
            </div>
            <div>
              <p className="text-terra-500">Vendedor</p>
              <p className="font-medium">{ad.author.username}</p>
            </div>
            <div>
              <p className="text-terra-500">Publicado</p>
              <p className="font-medium">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
