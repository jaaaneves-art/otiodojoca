import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bell, MessageSquare, Heart, ShoppingBag } from "lucide-react";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-terra-800">Almanaque</Link>
          <div className="flex items-center gap-3">
            <Link href="/forum" className="text-terra-600 hover:text-terra-800">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
              <ShoppingBag className="w-5 h-5" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>As tuas informacoes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-terra-600">Nome de utilizador</p>
                    <p className="font-medium">{profile?.username || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Nome</p>
                    <p className="font-medium">{profile?.display_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Localizacao</p>
                    <p className="font-medium">{profile?.location || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-terra-600">Bio</p>
                  <p className="font-medium">{profile?.bio || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-terra-500" />
                  <span className="text-sm text-terra-600">Reputacao: {profile?.reputation || 0}</span>
                </div>
                <Button asChild variant="outline">
                  <Link href="/perfil/editar">Editar perfil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Tópicos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Respostas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Favoritos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificacoes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-terra-50 rounded-lg text-sm">
                        <p className="text-terra-800">{notif.message}</p>
                        <p className="text-xs text-terra-400 mt-1">
                          {new Date(notif.created_at).toLocaleDateString("pt-PT")}
                        </p>
                        {notif.link && (
                          <Link href={notif.link} className="text-xs text-terra-600 hover:underline mt-1 block">
                            Ver
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-terra-500 text-sm text-center py-4">Sem notificacoes novas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

