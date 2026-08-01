import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AdForm } from "@/components/mercado-da-terra/ad-form";
import { updateAd } from "@/app/mercado-da-terra/actions";
import Link from "next/link";

export default async function EditarAnuncioPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar anúncio
  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .single();

  if (error || !ad) {
    notFound();
  }

  // Buscar imagens existentes
  const { data: existingPhotos } = await supabase
    .from("marketplace_photos")
    .select("id, storage_path, sort_order")
    .eq("ad_id", ad.id)
    .order("sort_order", { ascending: true });

  // Buscar categorias
  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  // Buscar municípios
  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao");

  // Action para editar
  const editAction = async (formData: FormData) => {
    "use server";
    await updateAd(parseInt(params.id), formData);
  };

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/mercado-da-terra/meus-anuncios" className="text-terra-600 hover:text-terra-800">
            ← Voltar aos Meus Anúncios
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-6">Editar Anúncio</h1>

        <AdForm
          categories={categories || []}
          municipios={municipios || []}
          action={editAction}
          inicial={ad}
          existingPhotos={existingPhotos || []}
          submitLabel="Guardar Alterações"
        />
      </main>
    </div>
  );
}
