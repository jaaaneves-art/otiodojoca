import { createClient } from "@/lib/supabase/server";
import { PostItem } from "@/components/forum/post-item";
import { ReplyForm } from "@/components/forum/reply-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select(`
      *,
      category:categories(name, slug),
      author:profiles(username)
    `)
    .eq("id", Number(params.id))
    .single();

  if (!thread) {
    return <div className="p-8 text-center">Tópico nao encontrado</div>;
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, username, reputation)
    `)
    .eq("thread_id", Number(params.id))
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/forum/${thread.category.slug}`} className="text-terra-600 hover:text-terra-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-sm text-terra-500">{thread.category.name}</span>
              <h1 className="text-xl font-bold text-terra-800">{thread.title}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/perfil">Perfil</Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-4 mb-8">
          {posts?.map((post) => (
            <PostItem
              key={post.id}
              post={post as any}
              currentUserId={user?.id}
            />
          ))}
        </div>

        {user ? (
          thread.is_locked ? (
            <div className="p-4 bg-terra-100 rounded-lg text-center text-terra-600">
              Este topico esta fechado. Não e possivel responder.
            </div>
          ) : (
            <ReplyForm threadId={Number(params.id)} />
          )
        ) : (
          <div className="p-4 bg-terra-100 rounded-lg text-center">
            <p className="text-terra-700">
              <Link href="/login" className="font-medium underline">Entra</Link>{" "}
              para responder a este topico.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
