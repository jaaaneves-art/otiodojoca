import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export async function socialSession() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");
  return { db, user };
}
export async function directConversation(id: string) {
  const { db, user } = await socialSession();
  if (!isUuid(id)) return null;
  const { data, error } = await db.from("conversations").select("id, direct_user_a, direct_user_b")
    .eq("id", id).eq("type", "direct").maybeSingle();
  if (error) throw new Error("Não foi possível carregar a conversa.");
  if (!data || ![data.direct_user_a, data.direct_user_b].includes(user.id)) return null;
  return { db, user, conversation: data };
}
