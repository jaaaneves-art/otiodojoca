import { createClient } from "@/lib/supabase/server";
import { CategoryCard } from "@/components/forum/category-card";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FórumPage() {
  const supabase = createClient();

  const { data: mainCategories } = await supabase
    .from("categories")
    .select(`
      *,
      children:categories!parent_id(id, name, slug, description, icon),
      threads:threads(count)
    `)
    .is("parent_id", null)
    .eq("type", "forum")
    .order("sort_order");

  const categoriesWithCount = mainCategories?.map((cat: any) => ({
    ...cat,
    thread_count: cat.threads?.[0]?.count || 0,
  }));

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-terra-800">Almanaque</Link>
            <span className="text-terra-300">/</span>
            <span className="text-terra-600">Fórum</span>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar />
            <Button asChild variant="outline">
              <Link href="/perfil">Perfil</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Fórum</h1>
        <p className="text-terra-600 mb-8">Partilha conhecimento, faz perguntas e aprende com a comunidade.</p>

        {categoriesWithCount?.map((category: any) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-semibold text-terra-800 mb-4 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.name}
            </h2>
            {category.description && <p className="text-sm text-terra-500 mb-3">{category.description}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.children?.map((sub: any) => (
                <CategoryCard key={sub.id} category={{ ...sub, thread_count: 0 }} />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

