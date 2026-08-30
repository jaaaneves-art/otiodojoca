import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategorias } from "@/lib/freguesia/actions";
import { PartnerRequestForm } from "@/components/entidades/partner-request-form";

export default async function PedidoEmpregadorPage() {
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
            Entra ou cria conta e depois volta a esta página para pedires o
            registo da tua empresa no Empregos.
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
          Pedido de registo — Empresa (Empregos)
        </h1>
        <p className="mb-6 text-sm text-terra-600">
          Regista a tua empresa para publicares vagas no Empregos (nome
          provisório JobNex). Depois de aprovado pela nossa equipa, a tua
          conta passa a ter acesso ao{" "}
          <Link href="/empregos/empresa" className="underline text-terra-700">
            painel de empresa
          </Link>{" "}
          para publicar e gerir vagas.
        </p>
        <PartnerRequestForm categorias={categorias} userEmail={user.email} tipoEntidade="empregador" />
      </div>
    </div>
  );
}
