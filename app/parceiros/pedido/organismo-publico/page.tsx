import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategorias } from "@/lib/freguesia/actions";
import { PartnerRequestFormOrganismo } from "@/components/entidades/partner-request-form-organismo";

export default async function PedidoOrganismoPublicoPage() {
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
            associacao do teu organismo.
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
          Pedido de associacao — Outro organismo publico
        </h1>
        <p className="mb-6 text-sm text-terra-600">
          Direcao Regional, Instituicao de Ensino, Centro de Investigacao,
          Casa do Povo ou outro organismo publico. Conta-nos sobre o
          organismo e a nossa equipa analisa o pedido.
        </p>
        <PartnerRequestFormOrganismo categorias={categorias} userEmail={user.email} />
      </div>
    </div>
  );
}
