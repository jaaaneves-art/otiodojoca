import { updateAd } from "../../actions";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AdForm } from "@/components/mercado-da-terra/ad-form";

export default async function EditarAnuncioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ad } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .single();

  if (!ad) {
    notFound();
  }

  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  const updateAdWithId = updateAd.bind(null, ad.id);

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/mercado-da-terra/meus-anuncios" className="text-terra-600 hover:text-terra-800">
            Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Editar Anúncio</h1>
        <p className="text-terra-600 mb-8">Atualiza os dados do anuncio</p>

        <AdForm
          categories={categories ?? []}
          municipios={municipios ?? []}
          action={updateAdWithId}
          inicial={ad}
          submitLabel="Guardar Alteracoes"
        />
      </main>
    </div>
  );
}
