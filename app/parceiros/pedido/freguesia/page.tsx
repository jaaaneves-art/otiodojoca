import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PartnerRequestFormFreguesia } from "@/components/entidades/partner-request-form-freguesia";

export default async function PedidoFreguesiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-terra-50">
        <div className="mx-auto max-w-md p-6 py-16 text-center">
          <h1 className="text-xl font-semibold text-terra-900">
            Precisas de entrar primeiro
          </h1>
          <p className="mt-2 text-sm text-terra-600">
            Entra ou cria conta e depois volta a esta pagina para pedires a
            associacao da tua freguesia.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/login" className="font-medium text-terra-700 underline">
              Entrar
            </Link>
            <Link href="/registo" className="font-medium text-terra-700 underline">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: freguesias } = await supabase
    .from("freguesias")
    .select("id, cod_ine, nome, municipio, localidade, email, telefone")
    .eq("active", true)
    .order("nome", { ascending: true });

  return (
    <div className="min-h-screen bg-terra-50">
      <div className="mx-auto max-w-xl p-6 py-16">
        <h1 className="mb-2 text-2xl font-bold text-terra-900">
          Pedido de associacao — Junta de Freguesia
        </h1>
        <p className="mb-6 text-sm text-terra-600">
          Representas uma Junta de Freguesia? Procura a tua freguesia e a
          nossa equipa analisa o pedido.
        </p>
        <PartnerRequestFormFreguesia freguesias={freguesias ?? []} userEmail={user.email} />
      </div>
    </div>
  );
}
