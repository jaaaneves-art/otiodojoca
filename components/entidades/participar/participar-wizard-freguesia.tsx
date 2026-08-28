"use client";

import { FormEvent, useMemo, useState } from "react";
import { ShieldCheck, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FreguesiaAutocomplete } from "@/components/entidades/freguesias/freguesia-autocomplete";
import { type MunicipioOption } from "@/components/entidades/municipios/municipio-id-autocomplete";
import {
  EMAIL_REGEX,
  ProgressoPassos,
  Cabecalho,
  Campo,
  Resumo,
  SummaryRow,
  semAcentos,
} from "@/components/entidades/participar/participar-shared";

// Wizard dedicado a Freguesia — /participar/freguesia. Irmão de
// participar-wizard-municipio.tsx; antes eram um único componente com um
// passo extra a perguntar o tipo, mas o utilizador pediu para separar em
// dois formulários próprios, um por rota. A gravação em entidade_pedidos
// e a validação (trigger + RLS da migration 20260828160000) não mudam —
// só deixa de haver um passo de escolha de tipo.
//
// A Freguesia é a fonte da verdade da localização — o Município é
// derivado automaticamente a partir dela (freguesias.municipio é texto,
// comparado sem acentos/maiúsculas contra municipios.nome), nunca
// escolhido em separado. Isto garante, já no frontend, que nunca existe
// "Freguesia de Município A + Município B" — o backend valida a mesma
// relação outra vez, no trigger da migration 20260828160000.

type Freguesia = {
  id: number;
  cod_ine: string;
  nome: string;
  municipio: string;
  localidade: string;
  email?: string;
  telefone?: string;
};

interface FormState {
  freguesia: Freguesia | null;
  municipio: MunicipioOption | null;
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
  freguesia: null,
  municipio: null,
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

export function ParticiparWizardFreguesia({
  freguesias,
  municipios,
}: {
  freguesias: Freguesia[];
  municipios: MunicipioOption[];
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(ESTADO_INICIAL);
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

  function selecionarFreguesia(f: Freguesia | null) {
    setForm((state) => {
      const municipioDerivado = f ? municipioIndex.get(semAcentos(f.municipio)) ?? null : null;
      const nomeOficial = state.nomeOficialAuto
        ? f
          ? `Junta de Freguesia de ${f.nome}`
          : ""
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
      if (!form.freguesia) {
        erros.freguesia = "Seleccione a freguesia.";
      } else if (!form.municipio) {
        erros.freguesia =
          "Não foi possível associar esta freguesia a um município reconhecido. Tente seleccionar novamente.";
      }
      if (!form.nomeOficial.trim()) erros.nomeOficial = "Indique o nome oficial da entidade.";
    }

    if (passo === 2) {
      if (!form.presidenteNome.trim()) erros.presidenteNome = "Indique o nome do Presidente.";
      if (!form.responsavelNome.trim())
        erros.responsavelNome = "Indique o nome da pessoa responsável pela informação.";
    }

    if (passo === 3) {
      const email = form.emailInstitucional.trim();
      if (!email) erros.emailInstitucional = "Indique o email institucional.";
      else if (!EMAIL_REGEX.test(email)) erros.emailInstitucional = "Introduza um email válido.";
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
      tipo_entidade: "freguesia",
      municipio_id: form.municipio?.id ?? null,
      freguesia_id: form.freguesia?.id ?? null,
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
          "Já existe um pedido pendente para esta freguesia. A nossa equipa está a analisá-lo — não é preciso submeter outra vez."
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
          Obrigado por se juntar ao OTJ. Recebemos o pedido de registo da sua freguesia. Depois
          da validação, enviaremos para o email institucional indicado as instruções para
          aceder à plataforma.
        </p>
        <p className="mt-3 text-sm text-terra-500">Não precisa de fazer mais nada por agora.</p>

        <div className="mt-8 space-y-2 rounded-2xl bg-terra-50 p-5 text-left text-sm">
          <SummaryRow label="Freguesia" value={form.nomeOficial} />
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
          Registo institucional — Freguesia
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-terra-900 sm:text-3xl">
          O registo demora apenas alguns minutos
        </h2>
      </div>

      <ProgressoPassos step={step} />

      <form
        onSubmit={step === 4 ? submeter : (e) => e.preventDefault()}
        className="rounded-3xl border border-terra-200 bg-white p-6 shadow-sm sm:p-8"
      >
        {step === 1 && (
          <section>
            <Cabecalho titulo="A sua Junta de Freguesia" texto="Diga-nos qual é a freguesia que pretende registar." />

            <div className="space-y-5">
              <div>
                <div className="rounded-xl border border-terra-200 bg-terra-50/60 p-4">
                  <FreguesiaAutocomplete freguesias={freguesias} onFreguesiaSelect={selecionarFreguesia} />
                </div>
                {form.freguesia && form.municipio && (
                  <p className="mt-2 text-xs text-terra-500">Freguesia de {form.municipio.nome}</p>
                )}
                {erroCampo.freguesia && <p className="mt-1.5 text-xs text-red-600">{erroCampo.freguesia}</p>}
              </div>
              <Campo
                label="Nome oficial da entidade"
                required
                value={form.nomeOficial}
                onChange={editarNomeOficial}
                placeholder="Nome oficial da Freguesia"
                error={erroCampo.nomeOficial}
              />
              <Campo label="NIPC / NIF" value={form.nipc} onChange={(v) => campo("nipc", v)} placeholder="Opcional" />
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
                <p className="mt-1 text-xs text-terra-500">Apenas o nome. Não precisamos de mais informação.</p>
                <div className="mt-4">
                  <Campo
                    label="Nome do Presidente da Junta"
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
                placeholder="nome@jf-freguesia.pt"
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
                <SummaryRow label="Freguesia" value={form.freguesia?.nome ?? "—"} />
                <SummaryRow label="Município" value={form.municipio?.nome ?? "—"} />
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

      <p className="mt-5 text-center text-xs text-terra-400">O registo é simples, seguro e sujeito a validação.</p>
    </div>
  );
}
