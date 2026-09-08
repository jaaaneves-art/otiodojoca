import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Music2,
  PartyPopper,
  Search,
  Sparkles,
  Theater,
  Ticket,
  Users,
} from "lucide-react";
import { TicketSelector } from "@/components/espectaculos/ticket-selector";
import type { Availability } from "@/lib/espectaculos/types";
import { createClient } from "@/lib/supabase/server";

type EventoRow = {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  freguesia_id: number;
  lugar: string | null;
  entidade_organizadora_id: number | null;
  tipo: string;
  estado: string;
};

type FreguesiaRow = {
  id: number;
  nome: string;
  municipio: string;
};

type EntidadeRow = {
  id: number;
  nome: string;
};

const filtros = [
  { value: "", label: "Todos", icon: Ticket },
  { value: "cultural", label: "Cultural", icon: Theater },
  { value: "festa", label: "Festas", icon: PartyPopper },
  { value: "desporto", label: "Desporto", icon: Users },
  { value: "workshop", label: "Workshops", icon: Sparkles },
  { value: "encontro", label: "Encontros", icon: Music2 },
  { value: "outro", label: "Outros", icon: CalendarDays },
] as const;

const tiposValidos = new Set<string>(filtros.map((f) => f.value).filter(Boolean));

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(new Date(valor));
}

function etiquetaTipo(tipo: string) {
  const item = filtros.find((f) => f.value === tipo);
  return item?.label ?? tipo;
}

export default async function EspectaculosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; evento?: string }>;
}) {
  const params = await searchParams;
  const tipo = params.tipo && tiposValidos.has(params.tipo) ? params.tipo : "";
  const eventoSelecionadoId = Number(params.evento);

  const supabase = await createClient();

  const { data: eventosData, error: eventosError } = await supabase
    .rpc("event_upcoming", { p_type: tipo || null })
    .select("id,nome,slug,descricao,inicio,fim,freguesia_id,lugar,entidade_organizadora_id,tipo,estado");
  const eventos = (eventosData ?? []) as EventoRow[];

  const freguesiaIds = [...new Set(eventos.map((e) => e.freguesia_id))];
  const entidadeIds = [
    ...new Set(
      eventos
        .map((e) => e.entidade_organizadora_id)
        .filter((id): id is number => id !== null)
    ),
  ];

  const [{ data: freguesiasData }, { data: entidadesData }] = await Promise.all([
    freguesiaIds.length
      ? supabase
          .from("freguesias")
          .select("id,nome,municipio")
          .in("id", freguesiaIds)
      : Promise.resolve({ data: [] as FreguesiaRow[] }),
    entidadeIds.length
      ? supabase.from("entidades").select("id,nome").in("id", entidadeIds)
      : Promise.resolve({ data: [] as EntidadeRow[] }),
  ]);

  const freguesias = new Map(
    ((freguesiasData ?? []) as FreguesiaRow[]).map((f) => [f.id, f])
  );
  const entidades = new Map(
    ((entidadesData ?? []) as EntidadeRow[]).map((e) => [e.id, e])
  );

  const selecionado =
    eventos.find((evento) => evento.id === eventoSelecionadoId) ??
    eventos[0] ??
    null;

  const selecionadoLocal = selecionado
    ? freguesias.get(selecionado.freguesia_id)
    : undefined;

  const { data: sessions, error: sessionsError } = selecionado
    ? await supabase.from("event_sessions").select("id,starts_at,status").eq("evento_id", selecionado.id).gte("starts_at", new Date().toISOString()).order("starts_at")
    : { data: [], error: null };
  const sessionTypes = await Promise.all((sessions ?? []).map(async session => {
    const { data, error } = await supabase.rpc("event_public_availability", { p_session: session.id });
    return { session, types: (data ?? []) as Availability[], error };
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="group">
            <div className="text-2xl font-black tracking-tight text-slate-950">
              OTJ
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              O Tio do Joca
            </div>
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="rounded-lg px-3 py-2 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Início
            </Link>
            <Link
              href="/espectaculos"
              className="rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-700"
            >
              Espetáculos
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_20%_10%,rgba(244,63,94,0.38),transparent_28%),radial-gradient(circle_at_55%_0%,rgba(168,85,247,0.28),transparent_28%),radial-gradient(circle_at_85%_35%,rgba(59,130,246,0.24),transparent_28%)]" />
        <div className="absolute -bottom-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-[50%] bg-rose-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1.3fr_0.7fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-rose-100 backdrop-blur">
              <Ticket className="h-4 w-4" />
              Espetáculos · OTJ
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-rose-500 p-3 shadow-lg shadow-rose-950/30">
                <Ticket className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Espetáculos
              </h1>
            </div>

            <p className="max-w-2xl text-xl font-semibold text-slate-100">
              Concertos, cultura, festas, encontros e muito mais.
            </p>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300">
              Descobre eventos reais já publicados no OTJ. A bilheteira e a
              organização profissional de espetáculos passam a viver aqui.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#eventos"
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:bg-rose-500"
              >
                <Search className="h-5 w-5" />
                Ver eventos
              </a>
              <Link
                href="/espectaculos/organizador"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
              >
                <Sparkles className="h-5 w-5" />
                Organizar um espetáculo
              </Link>
            </div>
          </div>

          <div className="hidden items-end justify-end lg:flex">
            <div className="max-w-xs rotate-[-2deg] text-right">
              <p className="text-3xl font-medium italic leading-tight text-rose-100">
                “A cultura também é a nossa comunidade.”
              </p>
              <div className="mt-4 flex justify-end">
                <span className="text-5xl text-rose-400">♡</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {filtros.map((filtro) => {
            const Icon = filtro.icon;
            const ativo = tipo === filtro.value;
            const href = filtro.value
              ? `/espectaculos?tipo=${filtro.value}`
              : "/espectaculos";

            return (
              <Link
                key={filtro.label}
                href={href}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  ativo
                    ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                {filtro.label}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section id="eventos">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-700">
                  Agenda OTJ
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Próximos eventos
                </h2>
              </div>
              <div className="text-sm text-slate-500">
                {eventos.length} {eventos.length === 1 ? "evento" : "eventos"}
              </div>
            </div>

            {eventosError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
                Não foi possível carregar a agenda de espetáculos neste
                momento.
              </div>
            ) : eventos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
                <h3 className="mt-4 text-lg font-bold">
                  Ainda não existem eventos publicados
                </h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Volta em breve para descobrir novas datas e reservar os teus bilhetes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventos.map((evento) => {
                  const freguesia = freguesias.get(evento.freguesia_id);
                  const entidade = evento.entidade_organizadora_id
                    ? entidades.get(evento.entidade_organizadora_id)
                    : undefined;
                  const ativo = selecionado?.id === evento.id;

                  return (
                    <Link
                      key={evento.id}
                      href={`/espectaculos/eventos/${evento.id}`}
                      className={`group grid gap-4 rounded-2xl border bg-white p-4 transition sm:grid-cols-[92px_1fr_auto] sm:items-center ${
                        ativo
                          ? "border-rose-300 shadow-sm ring-2 ring-rose-100"
                          : "border-slate-200 hover:border-rose-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex h-20 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 via-purple-950 to-rose-950 text-white">
                        <div className="text-center">
                          <CalendarDays className="mx-auto mb-1 h-5 w-5 text-rose-300" />
                          <span className="text-xs font-bold uppercase">
                            {evento.tipo}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                            {etiquetaTipo(evento.tipo)}
                          </span>
                        </div>
                        <h3 className="truncate text-lg font-black text-slate-950">
                          {evento.nome}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {formatarData(evento.inicio)}
                          </span>
                          {(evento.lugar || freguesia) && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-4 w-4" />
                              {evento.lugar ??
                                `${freguesia?.nome}, ${freguesia?.municipio}`}
                            </span>
                          )}
                        </div>
                        {entidade && (
                          <p className="mt-2 text-xs font-medium text-slate-500">
                            Organização: {entidade.nome}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 font-semibold text-rose-700">
                        Bilheteira
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <aside
            id="bilheteira"
            className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-5"
          >
            <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-rose-950 p-6 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-rose-100">
                <Ticket className="h-4 w-4" />
                Bilheteira OTJ
              </div>
              <h2 className="text-2xl font-black">Bilheteira</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Consulta as sessões e os tipos de bilhete configurados
                pelos organizadores.
              </p>
            </div>

            {selecionado ? (
              <div className="p-6">
                <div className="border-b border-slate-100 pb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
                    Evento selecionado
                  </p>
                  <h3 className="mt-2 text-xl font-black">
                    {selecionado.nome}
                  </h3>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{formatarData(selecionado.inicio)}</span>
                    </div>
                    {(selecionado.lugar || selecionadoLocal) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {selecionado.lugar ??
                            `${selecionadoLocal?.nome}, ${selecionadoLocal?.municipio}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 py-5">
                  <Link href="/espectaculos/encomendas" className="text-sm font-semibold text-rose-700">As minhas encomendas</Link>
                  <Link className="block font-semibold text-rose-700" href={`/espectaculos/eventos/${selecionado.id}`}>Descrição e todas as sessões →</Link><h4 className="font-bold">Sessões e bilhetes</h4>
                  {sessionsError ? <p>Não foi possível carregar as sessões.</p> : !sessionTypes.length ? <p>Sem sessões futuras disponíveis.</p> : sessionTypes.map(({ session, types, error }) => <section key={session.id} className="space-y-2">
                    <h5 className="text-sm font-semibold">{formatarData(session.starts_at)}</h5>
                    {error ? <p>Disponibilidade temporariamente indisponível.</p> : <TicketSelector sessionId={session.id} types={types} />}
                  </section>)}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Ticket className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 font-bold">Sem evento selecionado</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Quando existir um evento publicado, poderás selecioná-lo na
                  agenda e vê-lo aqui.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
