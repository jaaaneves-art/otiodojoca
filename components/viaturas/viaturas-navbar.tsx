import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Heart, House, LayoutDashboard, LogIn, MessageCircle, Plus, Users } from "lucide-react";
import { StandGoBrand } from "@/components/viaturas/standgo-brand";

export default async function ViaturasNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mensagens não lidas -- conversas ligadas a anúncios de Viaturas MAIS
  // as conversas diretas entre stands (ad_id null, module = "viaturas" --
  // ver migration 20260828140000_stand_automovel_contacto_direto.sql).
  let unreadTotal = 0;
  let isStandVerificado = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_stand_automovel")
      .eq("id", user.id)
      .maybeSingle();
    isStandVerificado = profile?.is_stand_automovel ?? false;

    const { data: viaturaAdIds } = await supabase
      .from("marketplace_ads")
      .select("id")
      .eq("module", "viaturas");

    const adIdSet = (viaturaAdIds || []).map((a: any) => a.id);

    const orCondicao =
      adIdSet.length > 0
        ? `ad_id.in.(${adIdSet.join(",")}),and(ad_id.is.null,module.eq.viaturas)`
        : `and(ad_id.is.null,module.eq.viaturas)`;

    const { data: convs } = await supabase
      .from("marketplace_conversations")
      .select("id")
      .or(orCondicao)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

    const convIds = (convs || []).map((c: any) => c.id);

    if (convIds.length > 0) {
      const { count } = await supabase
        .from("marketplace_messages")
        .select("id", { count: "exact", head: true })
        .in("conversation_id", convIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      unreadTotal = count || 0;
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-lg shadow-slate-950/10 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" aria-label="Voltar a O Tio do Joca" className="hidden rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white sm:inline-flex">
              <House size={18} aria-hidden="true" />
            </Link>
            <Link href="/viaturas" aria-label="Página inicial do StandGo">
              <StandGoBrand />
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link href="/viaturas/novo" className="inline-flex items-center gap-2 rounded-xl bg-[#b7f34a] px-3.5 py-2.5 text-sm font-extrabold text-slate-950 transition hover:bg-[#c8ff65] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4">
              <Plus size={17} strokeWidth={2.5} aria-hidden="true" />
              <span className="hidden sm:inline">Publicar anúncio</span>
              <span className="sm:hidden">Publicar</span>
            </Link>
            {!user && (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10">
                <LogIn size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}
          </div>
        </div>

        {user && (
          <div className="-mx-1 flex gap-1 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/viaturas" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <House size={16} aria-hidden="true" /> Mercado
            </Link>
            <Link href="/viaturas/favoritos" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <Heart size={16} aria-hidden="true" /> Favoritos
            </Link>
            <Link href="/viaturas/mensagens" className="relative inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <MessageCircle size={16} aria-hidden="true" /> Mensagens
              {unreadTotal > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-[#b7f34a] px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              )}
            </Link>
            <Link href="/viaturas/meus-anuncios" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
              <LayoutDashboard size={16} aria-hidden="true" /> Os meus anúncios
            </Link>
            {isStandVerificado && (
              <Link href="/viaturas/stands" className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                <Users size={16} aria-hidden="true" /> Rede de stands
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
