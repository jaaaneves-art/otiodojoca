import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "@/components/forum/thread-list";
import { NewThreadForm } from "@/components/forum/new-thread-form";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) {
    return <div className="p-8 text-center">Categoria nao encontrada</div>;
  }

  const { data: threads } = await supabase
    .from("threads")
    .select(`
      *,
      author:profiles(username)
    `)
    .eq("category_id", category.id)
    .order("is_pinned", { ascending: false })
    .order("last_post_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/forum" className="text-terra-600 hover:text-terra-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xl font-bold text-terra-800">
              {category.icon} {category.name}
            </span>
          </div>
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {category.description && <p className="text-terra-600 mb-6">{category.description}</p>}

        {user ? (
          <div className="mb-8">
            <NewThreadForm categoryId={category.id} />
          </div>
        ) : (
          <div className="mb-8 p-4 bg-terra-100 rounded-lg text-center">
            <p className="text-terra-700">
              <Link href="/login" className="font-medium underline">Entra</Link>{" "}
              ou{" "}
              <Link href="/registo" className="font-medium underline">regista-te</Link>{" "}
              para criar um topico.
            </p>
          </div>
        )}

        <h2 className="text-lg font-semibold text-terra-800 mb-4">
          Topicos ({threads?.length || 0})
        </h2>

        {threads && threads.length > 0 ? (
          <ThreadList threads={threads as any} />
        ) : (
          <p className="text-terra-500 text-center py-12">
            Ainda nao ha topicos nesta categoria. Se o primeiro a criar!
          </p>
        )}
      </main>
    </div>
  );
}
