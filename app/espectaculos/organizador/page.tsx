import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight, Ticket, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Membership = {
  entidade_id: number;
  role: string;
};

type Entidade = {
  id: number;
  nome: string;
  estado: string;
};

type Evento = {
  id: number;
  nome: string;
  inicio: string;
  estado: string;
  entidade_organizadora_id: number;
};

const roleLabel: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  manager: "Gestor",
  checkin: "Check-in",
  finance: "Financeiro",
};

export default async function OrganizadorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membershipsData, error: membershipsError } = await supabase
    .from("event_organization_members")
    .select("entidade_id,role")
    .eq("user_id", user.id);

  if (membershipsError) {
    throw new Error(
      "Não foi possível carregar as organizações: " + membershipsError.message
    );
  }

  const memberships = (membershipsData ?? []) as Membership[];
  const entidadeIds = memberships.map((membership) => membership.entidade_id);

  const [{ data: entidadesData }, { data: eventosData }] = await Promise.all([
    entidadeIds.length
      ? supabase
          .from("entidades")
          .select("id,nome,estado")
          .in("id", entidadeIds)
          .order("nome")
      : Promise.resolve({ data: [] as Entidade[] }),
    entidadeIds.length
      ? supabase
          .from("eventos")
          .select("id,nome,inicio,estado,entidade_organizadora_id")
          .in("entidade_organizadora_id", entidadeIds)
          .order("inicio", { ascending: false })
      : Promise.resolve({ data: [] as Evento[] }),
  ]);

  const entidades = (entidadesData ?? []) as Entidade[];
  const eventos = (eventosData ?? []) as Evento[];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <Link
              href="/espectaculos"
              className="text-sm font-medium text-rose-600 hover:text-rose-700"
            >
              ← Espetáculos
            </Link>
            <h1 className="mt-1 text-2xl font-black text-slate-950">
              Painel do organizador
            </h1>
          </div>

          <Ticket className="h-8 w-8 text-rose-500" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        {entidades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Ainda não tens uma organização de espetáculos
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                O acesso ao painel é atribuído apenas a membros autorizados de
                entidades existentes no OTJ.
              </p>
            </CardContent>
          </Card>
        ) : (
          entidades.map((entidade) => {
            const membership = memberships.find(
              (item) => item.entidade_id === entidade.id
            );

            const eventosEntidade = eventos.filter(
              (evento) => evento.entidade_organizadora_id === entidade.id
            );

            const podeGerir =
              membership?.role === "owner" ||
              membership?.role === "admin" ||
              membership?.role === "manager";

            return (
              <section key={entidade.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <CardTitle>{entidade.nome}</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                          {roleLabel[membership?.role ?? ""] ??
                            membership?.role ??
                            "Membro"}
                          {" · "}
                          {entidade.estado}
                        </p>
                      </div>

                      {podeGerir && (
                        <Button asChild>
                          <Link
                            href={`/espectaculos/organizador/eventos/novo?entidade=${entidade.id}`}
                          >
                            Novo espetáculo
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                <div>
                  <h2 className="mb-3 text-lg font-bold text-slate-900">
                    Espetáculos
                  </h2>

                  {eventosEntidade.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                      Esta organização ainda não tem espetáculos.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eventosEntidade.map((evento) => (
                        <Link
                          key={evento.id}
                          href={`/espectaculos/organizador/eventos/${evento.id}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-rose-200 hover:shadow-sm"
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900">
                                {evento.nome}
                              </h3>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {evento.estado}
                              </span>
                            </div>

                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                              <CalendarDays className="h-4 w-4" />
                              {new Intl.DateTimeFormat("pt-PT", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "Europe/Lisbon",
                              }).format(new Date(evento.inicio))}
                            </p>
                          </div>

                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
