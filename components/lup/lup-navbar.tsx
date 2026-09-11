import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogIn } from "lucide-react";
import LupNavLinks from "@/components/lup/lup-nav-links";
import { LupBrandMark } from "@/components/lup/lup-ui";

export default async function LupNavbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mensagens não lidas, só das conversas ligadas a anúncios do Lup.
  let unreadTotal = 0;

  if (user) {
    const { data: lupAdIds } = await supabase
      .from("marketplace_ads")
      .select("id")
      .eq("module", "lup");

    const adIdSet = (lupAdIds || []).map((a: any) => a.id);

    if (adIdSet.length > 0) {
      const { data: convs } = await supabase
        .from("marketplace_conversations")
        .select("id")
        .in("ad_id", adIdSet)
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
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-lup-950/95 shadow-[0_10px_35px_rgba(15,74,44,0.18)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/lup" aria-label="Página inicial do LUP" className="shrink-0">
          <LupBrandMark />
        </Link>

        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {user ? (
            <LupNavLinks unreadTotal={unreadTotal} />
          ) : (
            <Link href="/login" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-lup-400 px-4 py-2 text-sm font-black text-lup-950 transition hover:bg-lup-300">
              <LogIn className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
