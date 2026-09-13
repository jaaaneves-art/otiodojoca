import { createClient } from "@/lib/supabase/server";
import { saveLupAd } from '@/lib/lup/save-ad';
import { redirect, notFound } from "next/navigation";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";
import { PencilLine } from "lucide-react";
import { LupBackLink, LupPageHeader, lupPageClass } from "@/components/lup/lup-ui";

export default async function EditarAnuncioLupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: ad, error } = await supabase
    .from("marketplace_ads")
    .select("*")
    .eq("id", id)
    .eq("module", "lup")
    .single();

  if (error || !ad) {
    notFound();
  }

  if (ad.author_id !== user.id) {
    redirect("/lup");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("type", "lup")
    .order("sort_order");

  const { data: municipios } = await supabase
    .from("municipios")
    .select("nome, distrito_regiao")
    .order("nome");

  async function updateLupAd(formData: FormData) {
    "use server";

    const result = await saveLupAd(formData, ad.id);
    if ('error' in result) return result;
    redirect(`/lup/${result.id}`);
  }

  return (
    <>
      <LupNavbar />
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
          <LupBackLink href={`/lup/${ad.id}`}>Voltar ao anúncio</LupBackLink>
          <LupPageHeader eyebrow="Gestão do anúncio" title="Editar anúncio" description={ad.title} icon={PencilLine} />

          <LupAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={updateLupAd}
            inicial={{
              type: ad.type,
              title: ad.title,
              description: ad.description,
              category_id: ad.category_id,
              price: ad.price,
              location: ad.location,
              contact_method: ad.contact_method,
              quantity: ad.details?.quantity,
              unit: ad.details?.unit,
              kg_estimate: ad.details?.kg_estimate,
              pickup_starts_at: ad.details?.pickup_starts_at,
              pickup_ends_at: ad.details?.pickup_ends_at,
            }}
            submitLabel="Guardar Alterações"
          />
        </main>
      </div>
    </>
  );
}
