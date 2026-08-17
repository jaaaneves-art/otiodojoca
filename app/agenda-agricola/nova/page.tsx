import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NovaPlantacaoForm from "@/components/agenda-agricola/nova-plantacao-form";
import type { CulturaGuia } from "@/lib/agenda-agricola/tipos";

export default async function NovaPlantacaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: culturas } = await supabase
    .from("culturas_guia")
    .select("*")
    .order("nome");

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/agenda-agricola" className="text-sm text-terra-500 hover:text-terra-700">
            ← A minha Agricultura
          </Link>
          <h1 className="text-xl font-bold text-terra-800 mt-1">Nova plantação</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <NovaPlantacaoForm culturas={(culturas ?? []) as CulturaGuia[]} />
      </main>
    </div>
  );
}
