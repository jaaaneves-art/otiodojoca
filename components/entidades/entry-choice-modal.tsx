"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "otj_entry_choice_seen";

/**
 * Janela de boas-vindas: ajuda quem chega ao site a perceber logo por onde
 * deve entrar — cidadão (perfil individual) ou entidade parceira (Junta de
 * Freguesia, Município, Associação, Cooperativa, Organização de
 * Produtores...).
 *
 * Só deve ser montada para visitantes sem sessão iniciada (ver uso em
 * app/page.tsx). Aparece automaticamente na primeira visita (guardado em
 * localStorage do browser) e fica sempre acessível a partir do link fixo
 * mostrado abaixo, para quem a fechou sem escolher.
 */
export function EntryChoiceModal() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"escolha" | "parceiro">("escolha");

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // localStorage indisponível (modo privado, etc.) — mostra na mesma
      setOpen(true);
    }
  }, []);

  function close() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignora */
    }
  }

  function reopen() {
    setView("escolha");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={reopen}
        className="mb-8 block w-full rounded-lg border border-terra-200 bg-terra-100/60 px-4 py-3 text-left text-sm text-terra-700 hover:bg-terra-100"
      >
        És uma entidade parceira (Junta de Freguesia, Município, Associação,
        Cooperativa, Organização de Produtores…)?{" "}
        <strong className="text-terra-800">É aqui que entras →</strong>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-terra-900/50 p-4"
        >
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-terra-200 bg-white p-6 shadow-lg">
            <button
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="absolute right-4 top-4 text-2xl leading-none text-terra-400 hover:text-terra-700"
            >
              ×
            </button>

            {view === "escolha" && (
              <>
                <h2 className="text-xl font-semibold text-terra-900">
                  Bem-vindo ao O Tio do Joca
                </h2>
                <p className="mt-2 text-sm text-terra-600">
                  Para te levarmos ao sítio certo, diz-nos quem és.
                </p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/registo"
                    onClick={close}
                    className="block rounded-lg border border-terra-200 p-4 hover:border-terra-400 hover:bg-terra-50"
                  >
                    <div className="font-semibold text-terra-900">Sou cidadão</div>
                    <div className="text-sm text-terra-600">
                      Quero criar o meu perfil individual e participar na comunidade.
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setView("parceiro")}
                    className="block w-full rounded-lg border border-terra-200 p-4 text-left hover:border-terra-400 hover:bg-terra-50"
                  >
                    <div className="font-semibold text-terra-900">Sou entidade parceira</div>
                    <div className="text-sm text-terra-600">
                      Junta de Freguesia, Município, Cooperativa, Associação,
                      Organização de Produtores ou outra instituição/empresa
                      parceira.
                    </div>
                  </button>
                </div>
              </>
            )}

            {view === "parceiro" && (
              <>
                <h2 className="text-xl font-semibold text-terra-900">
                  Entrada de entidades parceiras
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-terra-700">
                  As entidades parceiras entram com{" "}
                  <strong>email e palavra-passe</strong>, tal como os
                  utilizadores individuais. Depois de entrares, usa{" "}
                  <Link
                    href="/parceiros"
                    onClick={close}
                    className="font-medium text-terra-700 underline"
                  >
                    Entidades Parceiras
                  </Link>{" "}
                  para pedires a associação da tua entidade.
                </p>
                <div className="mt-4 rounded-lg border border-terra-200 bg-terra-50 p-3 text-sm text-terra-700">
                  Brevemente vamos também permitir a entrada por{" "}
                  <strong>SSO com o email institucional</strong> da tua
                  organização (ex.: Google Workspace ou Microsoft 365 do
                  domínio da entidade). Essa opção ainda não está ativa — por
                  agora, usa o teu email e palavra-passe normalmente.
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button asChild onClick={close}>
                    <Link href="/login">Já tenho conta — Entrar</Link>
                  </Button>
                  <Button asChild variant="outline" onClick={close}>
                    <Link href="/registo">Ainda não tenho — Criar conta</Link>
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => setView("escolha")}
                  className="mt-5 text-sm text-terra-500 underline hover:text-terra-700"
                >
                  ← Voltar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
