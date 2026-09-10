import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntidadeBySlug } from '@/lib/freguesia/actions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Globe, MapPin, ArrowLeft, Calendar } from 'lucide-react';

interface EntidadePageProps {
  params: Promise<{
    slug: string;
  }>;
}

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

function formatarHora(hora?: string | null) {
  if (!hora) return null;
  return hora.slice(0, 5);
}

function formatarData(data?: string | null) {
  if (!data) return null;
  return new Date(data).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function generateMetadata({
  params,
}: EntidadePageProps): Promise<Metadata> {
  const { slug } = await params;
  const entidade = await getEntidadeBySlug(slug);

  if (!entidade) {
    return {
      title: 'Entidade não encontrada',
    };
  }

  return {
    title: `${entidade.nome} | O Tio do Joca`,
    description: entidade.descricao || `${entidade.nome} — ficha de entidade no O Tio do Joca`,
  };
}

export default async function EntidadePage({ params }: EntidadePageProps) {
  const { slug } = await params;
  const entidade = await getEntidadeBySlug(slug);

  if (!entidade) {
    notFound();
  }

  const categoria = entidade.categorias_entidade;
  const freguesia = entidade.freguesias;
  const horarios = [...(entidade.horarios || [])].sort(
    (a, b) => a.dia_semana - b.dia_semana
  );
  const excecoes = [...(entidade.horarios_excecoes || [])];
  const eventosPublicados = [...(entidade.eventos || [])].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  return (
    <div className="container py-10 max-w-3xl">
      {freguesia && (
        <Link
          href={`/freguesia/${freguesia.cod_ine}`}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar a {freguesia.nome}
        </Link>
      )}

      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{entidade.nome}</h1>
        </div>
        {categoria && (
          <Badge variant="secondary" className="mt-2">
            {categoria.icone && <span className="mr-1">{categoria.icone}</span>}
            {categoria.nome}
          </Badge>
        )}
        {entidade.descricao && (
          <p className="text-gray-700 mt-4">{entidade.descricao}</p>
        )}
      </div>

      {/* Contactos e localização */}
      {(entidade.telefone || entidade.email || entidade.website || entidade.lugar) && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">Contactos</h3>
            {entidade.lugar && (
              <div className="flex items-center text-sm text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                {entidade.lugar}
              </div>
            )}
            {entidade.telefone && (
              <div className="flex items-center text-sm text-gray-700">
                <Phone className="w-4 h-4 mr-2 text-blue-600" />
                <a href={`tel:${entidade.telefone}`}>{entidade.telefone}</a>
              </div>
            )}
            {entidade.email && (
              <div className="flex items-center text-sm text-gray-700">
                <Mail className="w-4 h-4 mr-2 text-blue-600" />
                <a href={`mailto:${entidade.email}`}>{entidade.email}</a>
              </div>
            )}
            {entidade.website && (
              <div className="flex items-center text-sm text-gray-700">
                <Globe className="w-4 h-4 mr-2 text-blue-600" />
                <a href={entidade.website} target="_blank" rel="noopener noreferrer">
                  Visitar website
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horário */}
      {horarios.length > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Horário</h3>
            <div className="space-y-1">
              {horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="flex justify-between text-sm text-gray-700 border-b border-gray-100 py-1 last:border-0"
                >
                  <span>{DIAS_SEMANA[horario.dia_semana]}</span>
                  <span>
                    {horario.hora_abertura && horario.hora_encerramento
                      ? `${formatarHora(horario.hora_abertura)} – ${formatarHora(horario.hora_encerramento)}`
                      : 'Encerrado'}
                  </span>
                </div>
              ))}
            </div>
            {excecoes.length > 0 && (
              <div className="mt-4 space-y-1">
                <p className="text-sm font-medium text-amber-700">Encerramentos e horários excecionais</p>
                {excecoes.map((excecao) => (
                  <p key={excecao.id} className="text-sm text-gray-600">
                    {formatarData(excecao.data_inicio)}
                    {excecao.data_fim && excecao.data_fim !== excecao.data_inicio
                      ? ` a ${formatarData(excecao.data_fim)}`
                      : ''}
                    {excecao.motivo ? ` — ${excecao.motivo}` : ''}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Eventos */}
      {eventosPublicados.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">Próximos eventos</h3>
            <div className="space-y-3">
              {eventosPublicados.map((evento) => (
                <div key={evento.id} className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{evento.nome}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(evento.inicio).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
