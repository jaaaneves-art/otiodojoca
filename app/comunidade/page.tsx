import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  HeartHandshake,
  LockKeyhole,
  MapPinned,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const communityAreas = [
  {
    title: "Grupos",
    description:
      "Cria um espaço para a tua terra, associação ou interesse e junta pessoas à volta do que importa.",
    href: "/grupos",
    linkLabel: "Explorar grupos",
    icon: UsersRound,
    tone: "bg-[#e8f0d8] text-[#375238]",
  },
  {
    title: "Fórum",
    description:
      "Faz perguntas, troca experiências e deixa conhecimento útil para toda a comunidade.",
    href: "/forum",
    linkLabel: "Entrar no Fórum",
    icon: BookOpenText,
    tone: "bg-[#f6dfcb] text-[#7a412c]",
  },
  {
    title: "Mensagens",
    description:
      "Conversa em privado com outros membros, com tranquilidade e sem expores os teus contactos.",
    href: "/mensagens",
    linkLabel: "Abrir mensagens",
    icon: MessageCircleMore,
    tone: "bg-[#dce9e8] text-[#255554]",
    privateArea: true,
  },
  {
    title: "O meu perfil",
    description:
      "Apresenta-te à comunidade, acompanha a tua atividade e gere a forma como apareces no OTJ.",
    href: "/perfil",
    linkLabel: "Ver o meu perfil",
    icon: UserRound,
    tone: "bg-[#eee4f3] text-[#63406f]",
    privateArea: true,
  },
  {
    title: "Comunidades locais",
    description:
      "Encontra a tua freguesia e aproxima-te das pessoas, entidades e iniciativas da tua região.",
    href: "/freguesias",
    linkLabel: "Encontrar a minha terra",
    icon: MapPinned,
    tone: "bg-[#f3e8c9] text-[#6d5727]",
  },
];

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[#f4f0e8] text-[#18352f]">
      <nav className="border-b border-[#18352f]/10 bg-[#f4f0e8]/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#48635b] transition-colors hover:text-[#18352f]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            O Tio do Joca
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/mensagens"
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/70"
                >
                  Mensagens
                </Link>
                <Link
                  href="/perfil"
                  className="rounded-full bg-[#18352f] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  O meu perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/70"
                >
                  Entrar
                </Link>
                <Link
                  href="/registo"
                  className="rounded-full bg-[#18352f] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        <section className="overflow-hidden border-b border-[#18352f]/10 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20">
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="pointer-events-none absolute -right-36 -top-48 h-80 w-80 rounded-full bg-[#dbe5b4]/60 blur-3xl" />
            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#18352f]/15 bg-white/60 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#48635b]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Rede Social OTJ
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-[#18352f] sm:text-6xl lg:text-7xl">
                A nossa terra também se encontra aqui.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#50675f] sm:text-xl">
                Um lugar português para conhecer pessoas, criar grupos,
                conversar e partilhar o que sabemos — com proximidade, respeito
                e raízes.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href={user ? "/grupos" : "/registo"}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d95d39] px-6 py-3.5 font-bold text-white shadow-[0_12px_30px_rgba(150,62,37,0.2)] transition-transform hover:-translate-y-0.5"
                >
                  {user ? "Descobrir grupos" : "Juntar-me à comunidade"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/forum"
                  className="inline-flex items-center rounded-full border border-[#18352f]/20 bg-white/55 px-6 py-3.5 font-bold transition-colors hover:bg-white"
                >
                  Visitar o Fórum
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <div className="absolute -left-5 -top-5 h-full w-full rounded-[2rem] border border-[#18352f]/15" />
              <div className="relative rounded-[2rem] bg-[#18352f] p-7 text-white shadow-[0_30px_80px_rgba(24,53,47,0.22)] sm:p-9">
                <HeartHandshake className="h-10 w-10 text-[#e6eebf]" aria-hidden="true" />
                <p className="mt-12 text-2xl font-bold leading-snug">
                  “Uma comunidade faz-se de pessoas que têm algo para dar e
                  espaço para escutar.”
                </p>
                <div className="mt-8 border-t border-white/15 pt-5 text-sm text-white/65">
                  Próxima, útil e feita em português.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9 max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#d95d39]">
                Escolhe o teu lugar
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Tudo o que aproxima a comunidade
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
              {communityAreas.map((area, index) => {
                const Icon = area.icon;
                const target = area.privateArea && !user ? "/login" : area.href;

                return (
                  <Link
                    key={area.title}
                    href={target}
                    className={`group flex min-h-64 flex-col rounded-[1.75rem] border border-[#18352f]/10 bg-white/70 p-6 shadow-[0_10px_35px_rgba(24,53,47,0.05)] transition-all hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_45px_rgba(24,53,47,0.1)] ${
                      index < 2 ? "lg:col-span-3" : "lg:col-span-2"
                    }`}
                  >
                    <div className={`w-fit rounded-2xl p-3 ${area.tone}`}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-7 text-2xl font-black tracking-tight">
                      {area.title}
                    </h3>
                    <p className="mt-3 flex-1 leading-7 text-[#5a6d67]">
                      {area.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#b3482b]">
                      {area.privateArea && !user ? "Entrar para continuar" : area.linkLabel}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
            <Value icon={ShieldCheck} title="Respeito primeiro">
              Regras claras e ferramentas para uma convivência mais segura.
            </Value>
            <Value icon={LockKeyhole} title="Tu controlas o contacto">
              As conversas privadas acontecem sem publicar dados pessoais.
            </Value>
            <Value icon={MapPinned} title="Da freguesia ao mundo">
              A proximidade local com espaço para toda a comunidade portuguesa.
            </Value>
          </div>
        </section>
      </main>
    </div>
  );
}

function Value({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#18352f]/10 bg-[#ebe6dc] p-5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#d95d39]" aria-hidden="true" />
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#5a6d67]">{children}</p>
      </div>
    </div>
  );
}
