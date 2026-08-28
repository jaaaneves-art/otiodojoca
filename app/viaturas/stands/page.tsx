import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { startStandConversation } from "./actions";

export default async function StandsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=" + encodeURIComponent("/viaturas/stands"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_stand_automovel")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_stand_automovel) {
    return (
      <>
        <ViaturasNavbar />
        <div className="min-h-screen bg-viaturas-50">
          <main className="max-w-2xl mx-auto p-6 py-16 text-center">
            <div className="mb-3 text-4xl">🤝</div>
            <h1 className="text-2xl font-bold text-viaturas-900 mb-2">
              Área exclusiva para stands verificados
            </h1>
            <p className="text-viaturas-700 mb-6">
              Aqui, comerciantes de automóveis verificados contactam-se diretamente uns
              aos outros -- fora do fluxo normal de compra e venda. Para teres acesso, a
              tua empresa precisa de estar registada como entidade parceira com o Código
              de Atividade Económica (CAE) do setor automóvel.
            </p>
            <Link href="/parceiros/pedido">
              <button className="bg-viaturas-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-viaturas-700">
                Pedir registo de entidade parceira
              </button>
            </Link>
          </main>
        </div>
      </>
    );
  }

  const { data: stands } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, location")
    .eq("is_stand_automovel", true)
    .neq("id", user.id)
    .order("username");

  return (
    <>
      <ViaturasNavbar />
      <div className="min-h-screen bg-viaturas-50">
        <main className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-viaturas-900">🤝 Stands verificados</h1>
            <p className="text-viaturas-700 mt-2">
              Contacta diretamente outros comerciantes automóveis verificados na plataforma.
            </p>
          </div>

          {!stands || stands.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-viaturas-200">
              <p className="text-viaturas-700 text-lg">
                Ainda não há outros stands verificados na plataforma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stands.map((stand) => (
                <div key={stand.id} className="bg-white rounded-xl border border-viaturas-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {stand.avatar_url ? (
                      <img src={stand.avatar_url} alt={stand.username} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-viaturas-100 flex items-center justify-center text-xl">🚗</div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-viaturas-900 truncate">
                        {stand.display_name || stand.username}
                      </p>
                      {stand.location && (
                        <p className="text-xs text-viaturas-500 truncate">📍 {stand.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/perfil/${stand.id}`} className="flex-1">
                      <button className="w-full border border-viaturas-200 text-viaturas-700 text-sm font-medium py-2 px-3 rounded-lg hover:bg-viaturas-50">
                        Ver Perfil
                      </button>
                    </Link>
                    <form action={startStandConversation} className="flex-1">
                      <input type="hidden" name="otherId" value={stand.id} />
                      <button type="submit" className="w-full bg-viaturas-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-viaturas-700">
                        💬 Contactar
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
