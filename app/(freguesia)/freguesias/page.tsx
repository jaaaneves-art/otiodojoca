import { Metadata } from 'next';
import { getFreguesias } from '@/lib/freguesia/actions';
import { FreguesiasList } from '@/components/entidades/freguesias/freguesias-list';

export const metadata: Metadata = {
  title: 'Freguesias | O Tio do Joca',
  description: 'Encontra a tua freguesia e as entidades da tua comunidade.',
};

export default async function FreguesiasPage() {
  const freguesias = await getFreguesias();

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Freguesias</h1>
        <p className="text-gray-600 text-lg">
          Escolhe a tua freguesia para conheceres a comunidade, as entidades e os serviços locais.
        </p>
      </div>

      <FreguesiasList freguesias={freguesias} />
    </div>
  );
}
