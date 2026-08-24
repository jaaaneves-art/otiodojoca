import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategorias } from "@/lib/freguesia/actions";
import { PartnerRequestForm } from "@/components/entidades/partner-request-form";

export default async function PedidoParceiroPage() {
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
            associacao da tua entidade.
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

  const categorias = await getCategorias();

  return (
    <div className="min-h-screen bg-terra-50">
      <div className="mx-auto max-w-xl p-6 py-16">
        <h1 className="mb-2 text-2xl font-bold text-terra-900">
          Pedido de associacao — Outra entidade
        </h1>
        <p className="mb-6 text-sm text-terra-600">
          Associacao, Cooperativa, Produtor ou Empresa parceira. Conta-nos
          sobre a tua entidade e a nossa equipa analisa o pedido.
        </p>
        <PartnerRequestForm categorias={categorias} userEmail={user.email} />
      </div>
    </div>
  );
}
