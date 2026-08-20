import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

import { LogoutButton } from "@/components/auth/logout-button";

import {
  ProfileCard,
  ProfileStats,
  ProfileActions,
  ProfileNotifications,
} from "@/components/profile";

export default async function ProfilePageV2() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-terra-50">

      <nav className="bg-white border-b border-terra-200">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          <Link
            href="/"
            className="text-xl font-bold text-terra-800"
          >
            Almanaque
          </Link>

          <LogoutButton />

        </div>

      </nav>

      <main className="mx-auto max-w-6xl p-6">

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            <ProfileCard
              profile={profile}
              email={user.email}
            />

            <ProfileStats />

          </div>

          <div className="space-y-6">

            <ProfileActions />

            <ProfileNotifications
              notifications={notifications ?? []}
            />

          </div>

        </div>

      </main>

    </div>
  );
}
