import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import ViaturasNavbar from "@/components/viaturas/viaturas-navbar";
import { startStandConversation } from "./actions";
import { Building2, MapPin, MessageCircle, ShieldCheck, UserRound } from "lucide-react";

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
        <div className="min-h-screen bg-[#f5f7fb]">
          <main className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Building2 size={26} /></span>
            <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-950">
              Área exclusiva para stands verificados
            </h1>
            <p className="mb-7 text-sm leading-6 text-slate-600">
              Aqui, comerciantes de automóveis verificados contactam-se diretamente uns
              aos outros -- fora do fluxo normal de compra e venda. Para teres acesso, a
              tua empresa precisa de estar registada como entidade parceira com o Código
              de Atividade Económica (CAE) do setor automóvel.
            </p>
            <Link href="/parceiros/pedido" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-extrabold text-white transition hover:bg-blue-500"><ShieldCheck size={18} /> Pedir verificação do stand</Link>
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
      <div className="min-h-screen bg-[#f5f7fb]">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-blue-600">Rede profissional</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-.04em] text-slate-950">Stands verificados</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Contacta diretamente outros comerciantes automóveis verificados na plataforma.
            </p>
          </div>

          {!stands || stands.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white py-16 text-center">
              <p className="text-lg font-bold text-slate-600">
                Ainda não há outros stands verificados na plataforma.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stands.map((stand) => (
                <article key={stand.id} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {stand.avatar_url ? (
                      <img src={stand.avatar_url} alt={stand.username} className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><UserRound size={22} /></div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-viaturas-900 truncate">
                        {stand.display_name || stand.username}
                      </p>
                      {stand.location && (
                        <p className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} /> <span className="truncate">{stand.location}</span></p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/perfil/${stand.id}`} className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-bold text-slate-600 transition hover:bg-slate-50">Ver perfil</Link>
                    <form action={startStandConversation} className="flex-1">
                      <input type="hidden" name="otherId" value={stand.id} />
                      <button type="submit" className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-500">
                        <MessageCircle size={15} /> Contactar
                      </button>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
