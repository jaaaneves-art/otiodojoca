"use client";

import { FormEvent, useId, useMemo, useState } from "react";
import {
  Landmark,
  Users,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FreguesiaAutocomplete,
} from "@/components/entidades/freguesias/freguesia-autocomplete";
import {
  MunicipioIdAutocomplete,
  type MunicipioOption,
} from "@/components/entidades/municipios/municipio-id-autocomplete";

// Wizard público de registo institucional (Município/Freguesia) para a
// página /participar. Grava directamente em "entidade_pedidos" via
// supabase-js, seguindo o mesmo padrão já usado pelos outros formulários
// deste projecto (components/entidades/partner-request-form*.tsx) — sem
// API route intermédia, a validação "backend" fica a cargo do trigger +
// RLS + índices únicos da migration 20260828160000. Não exige sessão:
// profile_id é preenchido se existir, senão fica nulo (pedido público).

type Freguesia = {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
  localidade: string;
  email?: string;
  telefone?: string;
};

type TipoEntidade = "municipio" | "freguesia";

interface FormState {
  tipo: TipoEntidade;
  municipio: MunicipioOption | null;
  freguesia: Freguesia | null;
  nomeOficial: string;
  nomeOficialAuto: boolean;
  nipc: string;
  morada: string;
  codigoPostal: string;
  localidade: string;
  telefone: string;
  website: string;
  presidenteNome: string;
  responsavelNome: string;
  emailInstitucional: string;
  confirmarEmail: string;
}

const ESTADO_INICIAL: FormState = {
  tipo: "municipio",
  municipio: null,
  freguesia: null,
  nomeOficial: "",
  nomeOficialAuto: true,
  nipc: "",
  morada: "",
  codigoPostal: "",
  localidade: "",
  telefone: "",
  website: "",
  presidenteNome: "",
  responsavelNome: "",
  emailInstitucional: "",
  confirmarEmail: "",
};

const PASSOS = [
  { numero: 1, titulo: "A sua entidade" },
  { numero: 2, titulo: "Responsáveis" },
  { numero: 3, titulo: "Acesso" },
  { numero: 4, titulo: "Confirmar" },
];

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function semAcentos(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function nomeAutomatico(tipo: TipoEntidade, municipioNome?: string, freguesiaNome?: string) {
  if (tipo === "municipio" && municipioNome) return `Câmara Municipal de ${municipioNome}`;
  if (tipo === "freguesia" && freguesiaNome) return `Junta de Freguesia de ${freguesiaNome}`;
  return "";
}

export function ParticiparWizard({
  municipios,
  freguesias,
  tipoInicial,
}: {
  municipios: MunicipioOption[];
  freguesias: Freguesia[];
  // Permite pré-seleccionar o tipo (usado pelos redirects vindos das
  // antigas rotas /parceiros/pedido/municipio e /parceiros/pedido/freguesia
  // — ver app/participar/page.tsx).
  tipoInicial?: TipoEntidade;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(
    tipoInicial ? { ...ESTADO_INICIAL, tipo: tipoInicial } : ESTADO_INICIAL
  );
  const [step, setStep] = useState(1);
  const [erroCampo, setErroCampo] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const municipioIndex = useMemo(() => {
    const mapa = new Map<string, MunicipioOption>();
    for (const m of municipios) mapa.set(semAcentos(m.nome), m);
    return mapa;
  }, [municipios]);

  function selecionarTipo(tipo: TipoEntidade) {
    setForm((f) => ({
      ...f,
      tipo,
      municipio: null,
      freguesia: null,
      nomeOficial: "",
      nomeOficialAuto: true,
    }));
    setErroCampo({});
  }

  function selecionarMunicipio(m: MunicipioOption | null) {
    setForm((f) => {
      const nomeOficial = f.nomeOficialAuto
        ? nomeAutomatico("municipio", m?.nome)
        : f.nomeOficial;
      return { ...f, municipio: m, nomeOficial };
    });
  }

  function selecionarFreguesia(f: Freguesia | null) {
    setForm((state) => {
      // A Freguesia é a fonte da verdade da localização — o Município é
      // derivado automaticamente a partir dela (freguesias.municipio é
      // texto, comparado sem acentos/maiúsculas contra municipios.nome),
      // nunca escolhido em separado. Isto garante, já no frontend, que
      // nunca existe "Freguesia de Município A + Município B" (secção 14
      // do pedido) — o backend valida a mesma relação outra vez, no
      // trigger da migration 20260828160000.
      const municipioDerivado = f ? municipioIndex.get(semAcentos(f.municipio)) ?? null : null;
      const nomeOficial = state.nomeOficialAuto
        ? nomeAutomatico("freguesia", undefined, f?.nome)
        : state.nomeOficial;
      return { ...state, freguesia: f, municipio: municipioDerivado, nomeOficial };
    });
  }

  function editarNomeOficial(valor: string) {
    setForm((f) => ({ ...f, nomeOficial: valor, nomeOficialAuto: false }));
  }

  function campo<K extends keyof FormState>(chave: K, valor: FormState[K]) {
    setForm((f) => ({ ...f, [chave]: valor }));
  }

  function validarPasso(passo: number): boolean {
    const erros: Record<string, string> = {};

    if (passo === 1) {
      if (form.tipo === "municipio" && !form.municipio) {
        erros.municipio = "Seleccione o município.";
      }
      if (form.tipo === "freguesia") {
        if (!form.freguesia) {
          erros.freguesia = "Seleccione a freguesia.";
        } else if (!form.municipio) {
          erros.freguesia =
            "Não foi possível associar esta freguesia a um município reconhecido. Tente seleccionar novamente.";
        }
      }
      if (!form.nomeOficial.trim()) {
        erros.nomeOficial = "Indique o nome oficial da entidade.";
      }
    }

    if (passo === 2) {
      if (!form.presidenteNome.trim()) {
        erros.presidenteNome = "Indique o nome do Presidente.";
      }
      if (!form.responsavelNome.trim()) {
        erros.responsavelNome = "Indique o nome da pessoa responsável pela informação.";
      }
    }

    if (passo === 3) {
      const email = form.emailInstitucional.trim();
      if (!email) {
        erros.emailInstitucional = "Indique o email institucional.";
      } else if (!EMAIL_REGEX.test(email)) {
        erros.emailInstitucional = "Introduza um email válido.";
      }
      if (form.emailInstitucional.trim().toLowerCase() !== form.confirmarEmail.trim().toLowerCase()) {
        erros.confirmarEmail = "Os endereços de email não coincidem.";
      }
    }

    setErroCampo(erros);
    return Object.keys(erros).length === 0;
  }

  function seguinte() {
    setErroGeral(null);
    if (!validarPasso(step)) return;
    setStep((s) => Math.min(s + 1, 4));
  }

  function anterior() {
    setErroGeral(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErroGeral(null);
    if (!validarPasso(1) || !validarPasso(2) || !validarPasso(3)) {
      setErroGeral("Reveja os passos anteriores — há campos por preencher.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();

    const { error } = await supabase.from("entidade_pedidos").insert({
      profile_id: auth.user?.id ?? null,
      tipo_entidade: form.tipo,
      municipio_id: form.municipio?.id ?? null,
      freguesia_id: form.tipo === "freguesia" ? form.freguesia?.id ?? null : null,
      nome_entidade: form.nomeOficial.trim(),
      nipc: form.nipc.trim() || null,
      morada: form.morada.trim() || null,
      codigo_postal: form.codigoPostal.trim() || null,
      localidade: form.localidade.trim() || null,
      contacto_telefone: form.telefone.trim() || null,
      website: form.website.trim() || null,
      presidente_nome: form.presidenteNome.trim(),
      responsavel_nome: form.responsavelNome.trim(),
      contacto_email: form.emailInstitucional.trim().toLowerCase(),
    });

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErroGeral(
          "Já existe um pedido pendente para esta entidade. A nossa equipa está a analisá-lo — não é preciso submeter outra vez."
        );
      } else if (error.code === "23514" || error.code === "23503") {
        setErroGeral(error.message || "Não foi possível validar os dados. Reveja o formulário.");
      } else {
        setErroGeral("Não foi possível enviar o pedido. Tente novamente dentro de momentos.");
      }
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-terra-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-terra-100 text-terra-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-terra-900">Está feito. 🌱</h2>
        <p className="mx-auto mt-4 max-w-lg leading-7 text-terra-600">
          Obrigado por se juntar ao OTJ. Recebemos o pedido de registo da sua entidade. Depois
          da validação, enviaremos para o email institucional indicado as instruções para
          aceder à plataforma.
        </p>
        <p className="mt-3 text-sm text-terra-500">Não precisa de fazer mais nada por agora.</p>

        <div className="mt-8 space-y-2 rounded-2xl bg-terra-50 p-5 text-left text-sm">
          <SummaryRow label={form.tipo === "municipio" ? "Município" : "Freguesia"} value={form.nomeOficial} />
          <SummaryRow label="Email institucional" value={form.emailInstitucional.trim().toLowerCase()} />
          <div className="flex items-center gap-2 pt-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
            <span className="text-xs font-medium text-terra-600">Em validação</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-10 text-center">
        <span className="inline-flex rounded-full bg-terra-100 px-4 py-1.5 text-sm font-medium text-terra-800">
          Registo institucional
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-terra-900 sm:text-3xl">
          O registo demora apenas alguns minutos
        </h2>
      </div>

      <div className="mb-8" aria-label="Progresso do registo">
        <div className="flex items-center justify-between text-xs font-medium text-terra-500">
          {PASSOS.map((p) => (
            <span
              key={p.numero}
              className={step >= p.numero ? "text-terra-800" : ""}
              aria-current={step === p.numero ? "step" : undefined}
            >
              {String(p.numero).padStart(2, "0")} · {p.titulo}
            </span>
          ))}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-terra-100">
          <div
            className="h-full rounded-full bg-terra-600 transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      <form
        onSubmit={step === 4 ? submeter : (e) => e.preventDefault()}
        className="rounded-3xl border border-terra-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {step === 1 && (
          <section>
            <Cabecalho titulo="Vamos começar" texto="Primeiro, diga-nos que entidade pretende registar." />

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <CartaoTipo
                seleccionado={form.tipo === "municipio"}
                onClick={() => selecionarTipo("municipio")}
                icon={<Landmark className="h-6 w-6" aria-hidden="true" />}
                titulo="Município"
                subtitulo="Câmara Municipal"
              />
              <CartaoTipo
                seleccionado={form.tipo === "freguesia"}
                onClick={() => selecionarTipo("freguesia")}
                icon={<Users className="h-6 w-6" aria-hidden="true" />}
                titulo="Freguesia"
                subtitulo="Junta de Freguesia"
              />
            </div>

            <div className="space-y-5">
              {form.tipo === "municipio" ? (
                <MunicipioIdAutocomplete
                  municipios={municipios}
                  value={form.municipio}
                  onSelect={selecionarMunicipio}
                  error={erroCampo.municipio}
                />
              ) : (
                <div>
                  <div className="rounded-xl border border-terra-200 bg-terra-50/60 p-4">
                    <FreguesiaAutocomplete freguesias={freguesias} onFreguesiaSelect={selecionarFreguesia} />
                  </div>
                  {form.freguesia && form.municipio && (
                    <p className="mt-2 text-xs text-terra-500">
                      Freguesia de {form.municipio.nome}
                    </p>
                  )}
                  {erroCampo.freguesia && (
                    <p className="mt-1.5 text-xs text-red-600">{erroCampo.freguesia}</p>
                  )}
                </div>
              )}

              <Campo
                label="Nome oficial da entidade"
                required
                value={form.nomeOficial}
                onChange={editarNomeOficial}
                placeholder={form.tipo === "municipio" ? "Nome oficial do Município" : "Nome oficial da Freguesia"}
                error={erroCampo.nomeOficial}
              />
              <Campo
                label="NIPC / NIF"
                value={form.nipc}
                onChange={(v) => campo("nipc", v)}
                placeholder="Opcional"
              />
              <Campo
                label="Morada"
                value={form.morada}
                onChange={(v) => campo("morada", v)}
                placeholder="Morada institucional"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo
                  label="Código postal"
                  value={form.codigoPostal}
                  onChange={(v) => campo("codigoPostal", v)}
                  placeholder="0000-000"
                />
                <Campo
                  label="Localidade"
                  value={form.localidade}
                  onChange={(v) => campo("localidade", v)}
                  placeholder="Localidade"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Campo
                  label="Telefone institucional"
                  value={form.telefone}
                  onChange={(v) => campo("telefone", v)}
                  placeholder="Opcional"
                />
                <Campo
                  label="Website"
                  value={form.website}
                  onChange={(v) => campo("website", v)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <Cabecalho
              titulo="Quem está connosco?"
              texto="Precisamos apenas de saber quem é o Presidente e quem ficará responsável pela informação da entidade."
            />

            <div className="space-y-6">
              <div className="rounded-2xl bg-terra-50 p-5">
                <p className="text-sm font-medium text-terra-800">Presidente</p>
                <p className="mt-1 text-xs text-terra-500">
                  Apenas o nome. Não precisamos de mais informação.
                </p>
                <div className="mt-4">
                  <Campo
                    label={form.tipo === "municipio" ? "Nome do Presidente da Câmara" : "Nome do Presidente da Junta"}
                    required
                    value={form.presidenteNome}
                    onChange={(v) => campo("presidenteNome", v)}
                    placeholder="Nome completo"
                    error={erroCampo.presidenteNome}
                  />
                </div>
              </div>

              <div className="rounded-2xl border-2 border-terra-200 bg-terra-50/40 p-5">
                <p className="text-sm font-medium text-terra-900">Pessoa responsável pela informação</p>
                <p className="mt-1 text-xs leading-5 text-terra-600">
                  A pessoa que ficará responsável por introduzir e manter a informação da
                  entidade no OTJ. Pode ser substituída no futuro sem alterar a entidade.
                </p>
                <div className="mt-4">
                  <Campo
                    label="Nome completo"
                    required
                    value={form.responsavelNome}
                    onChange={(v) => campo("responsavelNome", v)}
                    placeholder="Nome completo"
                    error={erroCampo.responsavelNome}
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <Cabecalho
              titulo="O seu acesso à plataforma"
              texto="O email institucional será utilizado para o acesso e para as comunicações relacionadas com a entidade."
            />

            <div className="rounded-2xl border border-terra-200 bg-terra-50 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="h-6 w-6 shrink-0 text-terra-700" aria-hidden="true" />
                <div>
                  <h3 className="font-medium text-terra-900">Acesso institucional</h3>
                  <p className="mt-1 text-sm leading-6 text-terra-600">
                    Utilize, sempre que possível, um endereço de email institucional da
                    entidade. Este endereço ficará associado ao acesso à plataforma.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <Campo
                label="Email institucional"
                required
                type="email"
                value={form.emailInstitucional}
                onChange={(v) => campo("emailInstitucional", v)}
                placeholder="nome@entidade.pt"
                error={erroCampo.emailInstitucional}
              />
              <Campo
                label="Confirmar email institucional"
                required
                type="email"
                value={form.confirmarEmail}
                onChange={(v) => campo("confirmarEmail", v)}
                placeholder="Volte a escrever o email"
                error={erroCampo.confirmarEmail}
              />
              <p className="text-xs leading-5 text-terra-500">
                Este será o endereço utilizado para o acesso à plataforma e para as
                comunicações relacionadas com a sua entidade.
              </p>
            </div>

            <p className="mt-6 text-xs leading-5 text-terra-500">
              Os dados fornecidos são utilizados exclusivamente para o processo de registo,
              gestão da entidade e acesso à plataforma.
            </p>
          </section>
        )}

        {step === 4 && (
          <section>
            <Cabecalho titulo="Está quase" texto="Confirme os dados antes de enviar o pedido." />

            <div className="space-y-6">
              <Resumo titulo="Entidade">
                <SummaryRow label="Tipo" value={form.tipo === "municipio" ? "Município" : "Freguesia"} />
                <SummaryRow label="Município" value={form.municipio?.nome ?? "—"} />
                {form.tipo === "freguesia" && (
                  <SummaryRow label="Freguesia" value={form.freguesia?.nome ?? "—"} />
                )}
                <SummaryRow label="Nome oficial" value={form.nomeOficial} />
                {form.nipc.trim() && <SummaryRow label="NIPC / NIF" value={form.nipc.trim()} />}
              </Resumo>
              <Resumo titulo="Responsáveis">
                <SummaryRow label="Presidente" value={form.presidenteNome} />
                <SummaryRow label="Responsável pela informação" value={form.responsavelNome} />
              </Resumo>
              <Resumo titulo="Acesso">
                <SummaryRow label="Email institucional" value={form.emailInstitucional.trim().toLowerCase()} />
              </Resumo>
            </div>
          </section>
        )}

        {erroGeral && (
          <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erroGeral}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-terra-100 pt-6">
          {step > 1 ? (
            <Button type="button" variant="ghost" onClick={anterior} disabled={loading}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button type="button" onClick={seguinte}>
              Continuar
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  A enviar...
                </>
              ) : (
                "Enviar pedido de registo"
              )}
            </Button>
          )}
        </div>
      </form>

      <p className="mt-5 text-center text-xs text-terra-400">
        O registo é simples, seguro e sujeito a validação.
      </p>
    </div>
  );
}

function Cabecalho({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mb-7">
      <h3 className="text-xl font-semibold text-terra-900">{titulo}</h3>
      <p className="mt-1 text-sm leading-6 text-terra-500">{texto}</p>
    </div>
  );
}

function CartaoTipo({
  seleccionado,
  onClick,
  icon,
  titulo,
  subtitulo,
}: {
  seleccionado: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  titulo: string;
  subtitulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={seleccionado}
      className={`rounded-2xl border p-5 text-left transition ${
        seleccionado
          ? "border-terra-600 bg-terra-50 ring-2 ring-terra-100"
          : "border-terra-200 hover:border-terra-400 hover:bg-terra-50/60"
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          seleccionado ? "bg-terra-600 text-white" : "bg-terra-100 text-terra-600"
        }`}
      >
        {icon}
      </span>
      <div className="mt-3 font-semibold text-terra-900">{titulo}</div>
      <div className="mt-0.5 text-xs text-terra-500">{subtitulo}</div>
    </button>
  );
}

interface CampoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  error?: string;
}

function Campo({ label, value, onChange, placeholder, required, type = "text", error }: CampoProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-terra-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-erro` : undefined}
      />
      {error && (
        <p id={`${id}-erro`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function Resumo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-terra-50 p-5">
      <h4 className="mb-4 font-semibold text-terra-900">{titulo}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-terra-200 pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-terra-500">{label}</span>
      <span className="text-sm font-medium text-terra-800 sm:text-right">{value || "—"}</span>
    </div>
  );
}
