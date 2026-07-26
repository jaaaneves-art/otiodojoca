import { createAd } from "../actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NovoAnuncioPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categories } = await supabase
    .from("marketplace_categories")
    .select("id, name")
    .order("name");

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/mercado-da-terra" className="text-terra-600 hover:text-terra-800">
            Voltar
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Publicar Novo Anuncio</h1>
        <p className="text-terra-600 mb-8">Preenche o formulario para publicar</p>

        <form action={createAd} className="bg-white p-6 rounded-lg border border-terra-200 space-y-4">
          <div>
            <label className="text-sm font-medium">Titulo *</label>
            <input name="title" placeholder="Ex: Batatas caseiras" required className="w-full border rounded-lg p-2 mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Descricao *</label>
            <textarea name="description" rows={4} placeholder="Descreve o produto..." required className="w-full border rounded-lg p-2 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Categoria *</label>
              <select name="categoryId" required className="w-full border rounded-lg p-2 mt-1">
                <option value="">Seleciona</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Preco *</label>
              <select name="priceType" defaultValue="fixed" className="w-full border rounded-lg p-2 mt-1">
                <option value="fixed">Preco Fixo</option>
                <option value="negotiable">Negociavel</option>
                <option value="free">Gratis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Preco (EUR)</label>
            <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full border rounded-lg p-2 mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Localidade *</label>
            <input name="location" placeholder="Ex: Aveiro" required className="w-full border rounded-lg p-2 mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium">Contacto *</label>
            <select name="contactMethod" required className="w-full border rounded-lg p-2 mt-1">
              <option value="message">Mensagem</option>
              <option value="phone">Telefone</option>
              <option value="email">Email</option>
            </select>
          </div>

          <button type="submit" className="w-full bg-terra-600 text-white font-medium py-2 rounded-lg hover:bg-terra-700">
            Publicar Anuncio
          </button>
        </form>
      </main>
    </div>
  );
}
