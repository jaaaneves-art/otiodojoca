import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFreguesiaByCodigo, getEntidadesByFreguesia, getCategorias } from '@/lib/freguesia/actions';
import { EntidadesList } from '@/components/entidades/freguesia/entidades-list';
import { Card, CardContent } from '@/components/ui/card';

interface FreguesiPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: FreguesiPageProps): Promise<Metadata> {
  const { slug } = await params;
  const freguesia = await getFreguesiaByCodigo(slug);

  if (!freguesia) {
    return {
      title: 'Freguesia não encontrada',
    };
  }

  return {
    title: `${freguesia.nome} | O Tio do Joca`,
    description: `Entidades e informações sobre ${freguesia.nome}`,
  };
}

export default async function FreguesiPage({ params }: FreguesiPageProps) {
  const { slug } = await params;
  const freguesia = await getFreguesiaByCodigo(slug);

  if (!freguesia) {
    notFound();
  }

  const [entidades, categorias] = await Promise.all([
    getEntidadesByFreguesia(freguesia.id),
    getCategorias(),
  ]);

  return (
    <div className="container py-10">
      {/* Hero */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold mb-2">{freguesia.nome}</h1>
        <p className="text-gray-600 text-lg">{freguesia.municipio}</p>

        {freguesia.descricao && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <p className="text-gray-700">{freguesia.descricao}</p>
            </CardContent>
          </Card>
        )}

        {/* Contacto da Junta */}
        {(freguesia.email || freguesia.telefone) && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Junta da Freguesia</h3>
              <div className="space-y-2">
                {freguesia.email && (
                  <p>
                    <span className="text-gray-600">Email:</span>{' '}
                    <a href={`mailto:${freguesia.email}`} className="text-blue-600 hover:underline">
                      {freguesia.email}
                    </a>
                  </p>
                )}
                {freguesia.telefone && (
                  <p>
                    <span className="text-gray-600">Telefone:</span>{' '}
                    <a href={`tel:${freguesia.telefone}`} className="text-blue-600 hover:underline">
                      {freguesia.telefone}
                    </a>
                  </p>
                )}
                {freguesia.morada && (
                  <p>
                    <span className="text-gray-600">Morada:</span> {freguesia.morada}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Entidades */}
      <EntidadesList
        entidades={entidades}
        categorias={categorias}
        frequesiaNome={freguesia.nome}
      />
    </div>
  );
}
