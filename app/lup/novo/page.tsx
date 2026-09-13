import { createClient } from "@/lib/supabase/server";
import { saveLupAd } from '@/lib/lup/save-ad';
import { redirect } from "next/navigation";
import { LupAdForm } from "@/components/lup/lup-ad-form";
import LupNavbar from "@/components/lup/lup-navbar";
import { PlusCircle } from "lucide-react";
import { LupBackLink, LupPageHeader, lupPageClass } from "@/components/lup/lup-ui";

async function createLupAd(formData: FormData) {
  "use server";

  const result = await saveLupAd(formData);
  if ('error' in result) return result;
  redirect(`/lup/${result.id}`);
}

export default async function NovoAnuncioLupPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
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

  return (
    <>
      <LupNavbar />
      <div className={lupPageClass}>
        <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
          <LupBackLink href="/lup">Voltar ao LUP</LupBackLink>
          <LupPageHeader eyebrow="Novo ciclo" title="Publicar no LUP" description="Doa, vende a preço simbólico ou pede excedentes. Leva apenas alguns minutos." icon={PlusCircle} />

          <LupAdForm
            categories={categories || []}
            municipios={municipios || []}
            action={createLupAd}
            submitLabel="Publicar"
          />
        </main>
      </div>
    </>
  );
}
