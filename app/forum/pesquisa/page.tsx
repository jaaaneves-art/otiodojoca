import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "@/components/forum/thread-list";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = await createClient();
  const query = searchParams.q || "";

  let threads = null;

  if (query) {
    const { data } = await supabase
      .from("threads")
      .select(`
        *,
        author:profiles(username)
      `)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "portuguese",
      })
      .order("last_post_at", { ascending: false });

    if (!data || data.length === 0) {
      const { data: fallback } = await supabase
        .from("threads")
        .select(`
          *,
          author:profiles(username)
        `)
        .ilike("title", `%${query}%`)
        .order("last_post_at", { ascending: false });
      threads = fallback;
    } else {
      threads = data;
    }
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/forum" className="text-terra-600 hover:text-terra-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-terra-900 mb-6">
          Resultados para "{query}"
        </h1>

        {threads && threads.length > 0 ? (
          <ThreadList threads={threads as any} />
        ) : query ? (
          <p className="text-terra-500 text-center py-12">
            Nenhum topico encontrado para "{query}".
          </p>
        ) : (
          <p className="text-terra-500 text-center py-12">
            Escreve algo na barra de pesquisa para encontrar topicos.
          </p>
        )}
      </main>
    </div>
  );
}
