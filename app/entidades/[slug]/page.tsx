import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntidadeBySlug } from '@/lib/freguesia/actions';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Globe, MapPin, ArrowLeft, Calendar, UtensilsCrossed, BedDouble, Store, Car, BadgeCheck } from 'lucide-react';

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
  const restaurante = entidade.restaurante;
  const alojamento = entidade.alojamento;
  const comercio = entidade.comercio;
  const horarios = [...(entidade.horarios || [])].sort(
    (a, b) => a.dia_semana - b.dia_semana
  );
  const excecoes = [...(entidade.horarios_excecoes || [])];
  const eventosPublicados = [...(entidade.eventos || [])].sort(
    (a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()
  );

  // StandGo — dados consultados em separado de propósito: getEntidadeBySlug é
  // partilhada por várias páginas e esta extensão vertical só interessa aqui.
  // Seleção explícita de campos públicos (ver
  // docs/standgo/20260915-ecossistema-profissional.md): nunca responsáveis,
  // IDs de perfis, identificação fiscal nem nome legal.
  const supabase = await createClient();

  const [{ data: standgoEmpresa }, { data: entidadeEmpresa }] = await Promise.all([
    supabase
      .from('standgo_empresas')
      .select('entidade_id')
      .eq('entidade_id', entidade.id)
      .eq('estado', 'ativo')
      .maybeSingle(),
    supabase
      .from('entidade_empresas')
      .select('verificada')
      .eq('entidade_id', entidade.id)
      .maybeSingle(),
  ]);

  const standgoAtivo = Boolean(standgoEmpresa);
  const standgoVerificada = entidadeEmpresa?.verificada ?? false;

  let standgoAtividades: string[] = [];
  let standgoAnuncios: {
    id: number;
    title: string;
    price: number | null;
    price_type: string | null;
  }[] = [];

  if (standgoAtivo) {
    const [{ data: atividadesRows }, { data: anunciosRows }] = await Promise.all([
      supabase
        .from('standgo_empresa_atividades')
        .select('standgo_atividades(nome)')
        .eq('entidade_id', entidade.id),
      // O filtro por entidade não existe em /viaturas — por isso os anúncios
      // ativos são listados aqui diretamente (status "active", como na
      // query principal do marketplace de viaturas).
      supabase
        .from('marketplace_ads')
        .select('id, title, price, price_type')
        .eq('entidade_id', entidade.id)
        .eq('module', 'viaturas')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    standgoAtividades = (atividadesRows ?? [])
      .map((row: { standgo_atividades: { nome: string } | { nome: string }[] | null }) => {
        const atividade = Array.isArray(row.standgo_atividades)
          ? row.standgo_atividades[0]
          : row.standgo_atividades;
        return atividade?.nome;
      })
      .filter((nome: string | undefined): nome is string => Boolean(nome))
      .sort((a, b) => a.localeCompare(b, 'pt-PT'));

    standgoAnuncios = anunciosRows ?? [];
  }

  const formatarPrecoStandGo = (price: number) =>
    new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(price);

  const precoResumoStandGo = (anuncio: {
    price: number | null;
    price_type: string | null;
  }) => {
    if (anuncio.price != null) return formatarPrecoStandGo(anuncio.price);
    if (anuncio.price_type === 'free') return 'Grátis';
    return 'Sob consulta';
  };

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

      {/* Fase F — dado do vertical associado (restaurante/alojamento/comércio), quando existir */}
      {restaurante && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-blue-600" />
              Restaurante
            </h3>
            {restaurante.especialidade && (
              <p className="text-sm text-gray-700">Especialidade: {restaurante.especialidade}</p>
            )}
            {restaurante.preco_medio != null && (
              <p className="text-sm text-gray-700">Preço médio: {restaurante.preco_medio}€</p>
            )}
            {restaurante.rating != null && (
              <p className="text-sm text-gray-700">Avaliação: {restaurante.rating}/5</p>
            )}
            <Link
              href={`/comer/${restaurante.id}`}
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              Ver ficha completa e reservar →
            </Link>
          </CardContent>
        </Card>
      )}

      {alojamento && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-blue-600" />
              Alojamento
            </h3>
            {alojamento.tipo && (
              <p className="text-sm text-gray-700">Tipo: {alojamento.tipo}</p>
            )}
            {alojamento.preco_noite != null && (
              <p className="text-sm text-gray-700">Preço/noite: {alojamento.preco_noite}€</p>
            )}
            {(alojamento.num_quartos != null || alojamento.num_camas != null) && (
              <p className="text-sm text-gray-700">
                {alojamento.num_quartos != null ? `${alojamento.num_quartos} quarto(s)` : ''}
                {alojamento.num_quartos != null && alojamento.num_camas != null ? ' · ' : ''}
                {alojamento.num_camas != null ? `${alojamento.num_camas} cama(s)` : ''}
              </p>
            )}
            {alojamento.rating != null && (
              <p className="text-sm text-gray-700">Avaliação: {alojamento.rating}/5</p>
            )}
            <Link
              href={`/alojamento/${alojamento.id}`}
              className="inline-block text-sm text-blue-600 hover:underline"
            >
              Ver ficha completa e reservar →
            </Link>
          </CardContent>
        </Card>
      )}

      {comercio && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600" />
              Comércio
            </h3>
            {comercio.tipo_comercio && (
              <p className="text-sm text-gray-700">Tipo: {comercio.tipo_comercio}</p>
            )}
            {(comercio.horario_abertura || comercio.horario_fecho) && (
              <p className="text-sm text-gray-700">
                Horário: {formatarHora(comercio.horario_abertura) ?? '?'} – {formatarHora(comercio.horario_fecho) ?? '?'}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Presença StandGo (viaturas) — só quando a empresa está ativa no módulo */}
      {standgoAtivo && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold flex flex-wrap items-center gap-2">
              <Car className="w-4 h-4 text-blue-600" />
              StandGo
              {standgoVerificada && (
                <Badge variant="secondary" className="inline-flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Verificada
                </Badge>
              )}
            </h3>
            {standgoAtividades.length > 0 && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Atividades: </span>
                {standgoAtividades.join(' · ')}
              </p>
            )}
            {standgoAnuncios.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="text-sm font-medium text-gray-900">Anúncios ativos</p>
                <ul className="space-y-1.5">
                  {standgoAnuncios.map((anuncio) => (
                    <li key={anuncio.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/viaturas/${anuncio.id}`}
                        className="min-w-0 truncate text-blue-600 hover:underline"
                      >
                        {anuncio.title}
                      </Link>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {precoResumoStandGo(anuncio)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
