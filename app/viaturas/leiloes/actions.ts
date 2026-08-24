"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Única forma válida de licitar: chama a mesma função Postgres
// gran_bazar_place_bid() usada pelo Gran Bazar (SECURITY DEFINER, com
// "select ... for update" na linha do leilão — ver
// supabase/migrations/20260823000000_gran_bazar_leiloes_ativos.sql e
// docs/VIATURAS.md, secção 3). Este server action NUNCA calcula ou valida
// o valor do lance aqui — isso acontece dentro da mesma transação da base
// de dados, com lock de linha.
export async function placeBid(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("É necessário iniciar sessão para licitar");
  }

  const auctionIdRaw = formData.get("auctionId") as string;
  const adId = formData.get("adId") as string | null;
  const amountRaw = formData.get("amount") as string;
  const requestId = (formData.get("requestId") as string) || null;

  const auctionId = parseInt(auctionIdRaw, 10);
  const amount = parseFloat(amountRaw);

  if (!auctionId || isNaN(amount) || amount <= 0) {
    throw new Error("Lance inválido");
  }

  const { data, error } = await supabase.rpc("gran_bazar_place_bid", {
    p_auction_id: auctionId,
    p_amount: amount,
    p_request_id: requestId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (adId) {
    revalidatePath(`/viaturas/${adId}`);
  }
  revalidatePath("/viaturas/leiloes");

  return data;
}
