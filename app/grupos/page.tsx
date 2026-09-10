import Link from "next/link";
import { socialSession } from "@/lib/social/messages";
import { GroupForm, InviteResponse } from "@/components/social/group-controls";

export default async function GroupsPage() {
  const { db, user } = await socialSession();
  const { data: groups, error } = await db.from("groups")
    .select("id, name, description, image_url, owner_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os grupos.");

  const { data: invites, error: invitesError } = await db.from("group_invites")
    .select("id, group_id, role, created_at")
    .eq("invitee_id", user.id).eq("status", "pending")
    .order("created_at", { ascending: false });
  if (invitesError) throw new Error("Não foi possível carregar os convites.");

  const inviteIds = (invites || []).map(i => i.id);
  const { data: inviteNotifications, error: notificationsError } = inviteIds.length
    ? await db.from("notifications").select("social_group_invite_id, message")
        .eq("user_id", user.id).in("social_group_invite_id", inviteIds)
    : { data: [], error: null };
  if (notificationsError) throw new Error("Não foi possível carregar os convites.");

  return <>
    <h1 className="text-3xl font-bold">Grupos</h1>

    {invites && invites.length > 0 && <section aria-label="Convites pendentes" className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Convites pendentes</h2>
      <ul className="space-y-4">{invites.map(invite => {
        const text = inviteNotifications?.find(n => n.social_group_invite_id === invite.id)?.message;
        return <li key={invite.id}>
          <p>{text || "Foste convidado para um grupo."}</p>
          <InviteResponse inviteId={invite.id} groupId={invite.group_id} />
        </li>;
      })}</ul>
    </section>}

    <GroupForm />

    {(!groups || groups.length === 0) && <p>Ainda não pertences a nenhum grupo. Cria um acima.</p>}
    <ul className="space-y-3">{groups?.map(group => <li key={group.id}>
      <Link href={`/grupos/${group.id}`} className="block rounded-xl border p-4 hover:bg-green-50">
        <span className="font-semibold">{group.name}</span>
        {group.owner_id === user.id && <span className="ml-3 rounded bg-green-100 px-2 text-sm">Owner</span>}
        {group.description && <p className="truncate">{group.description}</p>}
      </Link>
    </li>)}</ul>
  </>;
}
