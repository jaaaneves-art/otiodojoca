import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ParticiparWizardFreguesia } from "@/components/entidades/participar/participar-wizard-freguesia";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Registar Freguesia — O Tio do Joca",
  description: "Registo institucional para Juntas de Freguesia na rede do OTJ.",
};

export default async function ParticiparFreguesiaPage() {
  const supabase = await createClient();

  const [{ data: freguesiasBrutas }, { data: municipiosBrutos }] = await Promise.all([
    supabase
      .from("freguesias")
      .select("id, cod_ine, nome, municipio, localidade, email, telefone")
      .eq("active", true)
      .order("nome", { ascending: true }),
    supabase.from("municipios").select("id, nome, distrito_regiao").order("nome", { ascending: true }),
  ]);

  const freguesias = freguesiasBrutas ?? [];
  const municipios = municipiosBrutos ?? [];

  return (
    <div className="min-h-screen bg-terra-50">
      <header className="border-b border-terra-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-terra-900">
            O Tio do Joca
          </Link>
          <Link href="/login" className="text-sm font-medium text-terra-800 hover:text-terra-900">
            Já é parceiro? Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link
          href="/participar"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-terra-600 hover:text-terra-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar à escolha de entidade
        </Link>

        <ParticiparWizardFreguesia freguesias={freguesias} municipios={municipios} />
      </main>

      <footer className="border-t border-terra-200 py-8 text-center text-xs text-terra-400">
        O Tio do Joca — Almanaque da Comunidade
      </footer>
    </div>
  );
}
