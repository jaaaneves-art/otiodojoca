"use client";

import { useState } from "react";
import ImageUpload from "@/components/mercado-da-terra/image-upload";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { MarcaModeloAutocomplete } from "@/components/viaturas/marca-modelo-autocomplete";
import {
  VIATURAS_AD_TYPES,
  getViaturaAdType,
  COMBUSTIVEL_OPCOES,
  CAIXA_OPCOES,
  CONDICAO_OPCOES,
  TIPO_VENDEDOR_OPCOES,
  SEGURO_OPCOES,
} from "@/lib/viaturas/ad-types";

interface Categoria { id: number; name: string; }
interface Municipio { nome: string; distrito_regiao: string; }

interface AdInicial {
  type?: string;
  title?: string;
  description?: string;
  category_id?: number | null;
  price_type?: string;
  price?: number | null;
  location?: string | null;
  contact_method?: string;
  marca?: string;
  modelo?: string;
  ano?: string | number;
  quilometros?: string | number;
  combustivel?: string;
  caixa?: string;
  cor?: string;
  potencia?: string | number;
  cilindrada?: string | number;
  tracao?: string;
  condicao?: string;
  tipo_vendedor?: string;
  auction_start_price?: number | null;
  auction_minimum_increment?: number | null;
  /** ISO (UTC) — vem diretamente da coluna timestamptz da base de dados */
  auction_starts_at?: string | null;
  /** ISO (UTC) — idem */
  auction_ends_at?: string | null;
  auction_status?: string | null;
  budget?: string | number | null;
  preco_dia?: string | number | null;
  preco_3_dias?: string | number | null;
  preco_semana?: string | number | null;
  preco_2_semanas?: string | number | null;
  preco_mes?: string | number | null;
  caucao?: string | number | null;
  seguro?: string | null;
}

// <input type="datetime-local"> não sabe nada de fusos-horários — a mesma
// disciplina do bazar-ad-form.tsx original: conversão sempre no browser,
// via os getters *locais* do Date (nunca slicing de string UTC nem
// getters UTC), tanto ao mostrar como ao submeter.
function isoParaDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalParaIso(valor: string): string {
  if (!valor) return "";
  const d = new Date(valor); // string "naive" interpretada como hora local do browser
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function ViaturaAdForm({
  categories,
  municipios,
  action,
  inicial,
  submitLabel = "Publicar Anúncio",
}: {
  categories: Categoria[];
  municipios: Municipio[];
  action: (formData: FormData) => void | Promise<void>;
  inicial?: AdInicial;
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState(inicial?.type ?? "venda");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [combustivel, setCombustivel] = useState(inicial?.combustivel ?? "");
  const [caixa, setCaixa] = useState(inicial?.caixa ?? "");
  const [potencia, setPotencia] = useState(
    inicial?.potencia !== undefined && inicial?.potencia !== null
      ? String(inicial.potencia)
      : ""
  );
  const [cilindrada, setCilindrada] = useState(
    inicial?.cilindrada !== undefined && inicial?.cilindrada !== null
      ? String(inicial.cilindrada)
      : ""
  );
  const [tracao, setTracao] = useState(inicial?.tracao ?? "");
  const config = getViaturaAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);
  const obrigatorio = (campo: string) => config.required.includes(campo as any);

  // Mesma regra do Gran Bazar: um leilão já agendado só pode ter os seus
  // parâmetros alterados enquanto ainda não começou.
  const leilaoBloqueado = inicial?.type === "leilao" && !!inicial?.auction_status && inicial.auction_status !== "scheduled";

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
  };

  const handleVariantSelect = (variant: {
    fuel_type: string | null;
    displacement_cc: number | null;
    power_hp: number | null;
    transmission: string | null;
    drivetrain: string | null;
  }) => {
    const fuel = (variant.fuel_type ?? "").toLowerCase();

    if (fuel.includes("gasoline") || fuel.includes("petrol")) {
      setCombustivel("Gasolina");
    } else if (fuel.includes("diesel")) {
      setCombustivel("Diesel");
    } else if (fuel.includes("electric")) {
      setCombustivel("Elétrico");
    } else if (fuel.includes("hybrid")) {
      setCombustivel("Híbrido");
    } else if (fuel.includes("lpg")) {
      setCombustivel("GPL");
    }

    const transmission = (variant.transmission ?? "").toLowerCase();

    if (
      transmission.includes("automatic") ||
      transmission.includes("cvt") ||
      transmission.includes("dct")
    ) {
      setCaixa("Automática");
    } else if (transmission.includes("manual")) {
      setCaixa("Manual");
    }

    if (variant.power_hp != null) {
      setPotencia(String(variant.power_hp));
    }

    if (variant.displacement_cc != null) {
      setCilindrada(String(variant.displacement_cc));
    }

    const drivetrain = (variant.drivetrain ?? "").toLowerCase();

    if (drivetrain.includes("rear")) {
      setTracao("Traseira (RWD)");
    } else if (drivetrain.includes("front")) {
      setTracao("Dianteira (FWD)");
    } else if (drivetrain.includes("all wheel")) {
      setTracao("Integral (AWD)");
    } else if (
      drivetrain.includes("four wheel") ||
      drivetrain.includes("4wd")
    ) {
      setTracao("Integral (4WD)");
    } else if (variant.drivetrain) {
      setTracao(variant.drivetrain);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    if (tipo === "leilao") {
      const inicioRaw = formData.get("auctionStartsAt") as string;
      const fimRaw = formData.get("auctionEndsAt") as string;
      formData.set("auctionStartsAt", inicioRaw ? datetimeLocalParaIso(inicioRaw) : "");
      formData.set("auctionEndsAt", fimRaw ? datetimeLocalParaIso(fimRaw) : "");
    }

    uploadedFiles.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    formData.append("image_count", uploadedFiles.length.toString());

    await action(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-viaturas-200 space-y-4">
      <div>
        <label className="text-sm font-medium">O que queres fazer? *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {Object.values(VIATURAS_AD_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              disabled={leilaoBloqueado}
              title={leilaoBloqueado ? "Este leilão já começou — o tipo já não pode ser alterado" : undefined}
              onClick={() => setTipo(type.id)}
              className={`py-2 px-3 rounded-lg border font-medium text-sm transition ${
                tipo === type.id
                  ? "bg-viaturas-600 border-viaturas-600 text-white"
                  : "border-viaturas-200 text-viaturas-800 hover:bg-viaturas-50"
              } ${leilaoBloqueado ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={tipo} />
      </div>

      <div>
        <label className="text-sm font-medium">Título do anúncio *</label>
        <input
          name="title"
          defaultValue={inicial?.title ?? ""}
          placeholder="Ex: BMW Série 3 320d Pack M"
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div className="bg-viaturas-50 border border-viaturas-200 rounded-lg p-4 space-y-4">
        <p className="text-sm font-semibold text-viaturas-900">
          {tipo === "comprar" ? "🔍 O que procuras" : "🚗 Dados da viatura"}
        </p>

        <MarcaModeloAutocomplete
          marcaInicial={inicial?.marca ?? ""}
          modeloInicial={inicial?.modelo ?? ""}
          marcaObrigatoria={obrigatorio("marca")}
          modeloObrigatorio={obrigatorio("modelo")}
          onVariantSelect={handleVariantSelect}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Ano{obrigatorio("ano") && " *"}</label>
            <input
              name="ano"
              type="number"
              min="1900"
              max="2100"
              defaultValue={inicial?.ano ?? ""}
              placeholder="2020"
              required={obrigatorio("ano")}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Quilómetros{obrigatorio("quilometros") && " *"}</label>
            <input
              name="quilometros"
              type="number"
              min="0"
              defaultValue={inicial?.quilometros ?? ""}
              placeholder="45000"
              required={obrigatorio("quilometros")}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Combustível{obrigatorio("combustivel") && " *"}</label>
            <select
              name="combustivel"
              value={combustivel}
              onChange={(e) => setCombustivel(e.target.value)}
              required={obrigatorio("combustivel")}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="">Seleciona</option>
              {COMBUSTIVEL_OPCOES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Caixa{obrigatorio("caixa") && " *"}</label>
            <select
              name="caixa"
              value={caixa}
              onChange={(e) => setCaixa(e.target.value)}
              required={obrigatorio("caixa")}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="">Seleciona</option>
              {CAIXA_OPCOES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Condição{obrigatorio("condicao") && " *"}</label>
            <select
              name="condicao"
              defaultValue={inicial?.condicao ?? ""}
              required={obrigatorio("condicao")}
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="">Seleciona</option>
              {CONDICAO_OPCOES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Cor</label>
            <input
              name="cor"
              defaultValue={inicial?.cor ?? ""}
              placeholder="Ex: Cinzento"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Potência (cv)</label>
            <input
              name="potencia"
              type="number"
              min="0"
              value={potencia}
              onChange={(e) => setPotencia(e.target.value)}
              placeholder="150"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Cilindrada (cc)</label>
            <input
              name="cilindrada"
              type="number"
              min="0"
              value={cilindrada}
              onChange={(e) => setCilindrada(e.target.value)}
              placeholder="Ex: 1995"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tração</label>
            <input
              name="tracao"
              type="text"
              value={tracao}
              onChange={(e) => setTracao(e.target.value)}
              placeholder="Ex: Traseira (RWD)"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>

        {mostra("tipoVendedor") && (
          <div>
            <label className="text-sm font-medium">Tipo de vendedor</label>
            <select
              name="tipoVendedor"
              defaultValue={inicial?.tipo_vendedor ?? "Particular"}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {TIPO_VENDEDOR_OPCOES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={inicial?.description ?? ""}
          placeholder="Estado geral, histórico de manutenção, extras..."
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Categoria *</label>
        <select
          name="categoryId"
          defaultValue={inicial?.category_id ?? ""}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          <option value="">Seleciona uma categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {mostra("priceType") && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tipo de Preço *</label>
            <select
              name="priceType"
              defaultValue={inicial?.price_type ?? "fixed"}
              required
              className="w-full border rounded-lg p-2 mt-1"
            >
              <option value="fixed">Preço Fixo</option>
              <option value="negotiable">Negociável</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Preço (EUR) *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              defaultValue={inicial?.price ?? ""}
              placeholder="0.00"
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      )}

      {mostra("auctionStartPrice") && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-amber-900">🔨 Parâmetros do leilão</p>

          {leilaoBloqueado && (
            <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded p-2">
              Este leilão já começou (ou já terminou) — os valores e datas já não podem ser alterados.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço inicial (EUR) *</label>
              <input
                name="auctionStartPrice"
                type="number"
                step="0.01"
                min="0"
                disabled={leilaoBloqueado}
                defaultValue={inicial?.auction_start_price ?? ""}
                placeholder="0.00"
                required
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-viaturas-100 disabled:text-viaturas-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Incremento mínimo (EUR)</label>
              <input
                name="auctionMinIncrement"
                type="number"
                step="0.01"
                min="0.01"
                disabled={leilaoBloqueado}
                defaultValue={inicial?.auction_minimum_increment ?? "50.00"}
                placeholder="50.00"
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-viaturas-100 disabled:text-viaturas-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Início</label>
              <input
                name="auctionStartsAt"
                type="datetime-local"
                disabled={leilaoBloqueado}
                defaultValue={isoParaDatetimeLocal(inicial?.auction_starts_at)}
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-viaturas-100 disabled:text-viaturas-500"
              />
              <p className="text-xs text-viaturas-600 mt-1">Deixa em branco para começar já</p>
            </div>
            <div>
              <label className="text-sm font-medium">Encerramento *</label>
              <input
                name="auctionEndsAt"
                type="datetime-local"
                disabled={leilaoBloqueado}
                defaultValue={isoParaDatetimeLocal(inicial?.auction_ends_at)}
                required
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-viaturas-100 disabled:text-viaturas-500"
              />
            </div>
          </div>
        </div>
      )}

      {mostra("budget") && (
        <div>
          <label className="text-sm font-medium">Orçamento (EUR)</label>
          <input
            name="budget"
            type="number"
            step="0.01"
            min="0"
            defaultValue={inicial?.budget ?? ""}
            placeholder="Deixa em branco se não tiveres um valor definido"
            className="w-full border rounded-lg p-2 mt-1"
          />
        </div>
      )}

      {mostra("precoDia") && (
        <div className="bg-viaturas-50 border border-viaturas-200 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-viaturas-900">🔑 Preços do aluguer</p>
          <p className="text-xs text-viaturas-600">
            Só o preço por dia é obrigatório — os restantes escalões são opcionais, mas
            ajudam quem quer alugar por mais tempo (tal como nos sites de rent-a-car).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço por dia (EUR) *</label>
              <input
                name="precoDia"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.preco_dia ?? ""}
                placeholder="35.00"
                required
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preço 3 dias (EUR)</label>
              <input
                name="preco3Dias"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.preco_3_dias ?? ""}
                placeholder="90.00"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço 1 semana (EUR)</label>
              <input
                name="precoSemana"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.preco_semana ?? ""}
                placeholder="170.00"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preço 2 semanas (EUR)</label>
              <input
                name="preco2Semanas"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.preco_2_semanas ?? ""}
                placeholder="300.00"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Preço 1 mês (EUR)</label>
              <input
                name="precoMes"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.preco_mes ?? ""}
                placeholder="500.00"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Caução (EUR)</label>
              <input
                name="caucao"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.caucao ?? ""}
                placeholder="250.00"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Seguro</label>
            <select
              name="seguroIncluido"
              defaultValue={inicial?.seguro ?? "Incluído"}
              className="w-full border rounded-lg p-2 mt-1"
            >
              {SEGURO_OPCOES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <MunicipioAutocomplete municipios={municipios} valorInicial={inicial?.location ?? ""} />

      <ImageUpload onFilesSelected={handleFilesSelected} maxFiles={5} maxSizeMB={5} />

      <div>
        <label className="text-sm font-medium">Contacto *</label>
        <select
          name="contactMethod"
          defaultValue={inicial?.contact_method ?? "message"}
          required
          className="w-full border rounded-lg p-2 mt-1"
        >
          <option value="message">Mensagem</option>
          <option value="phone">Telefone</option>
          <option value="email">Email</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-viaturas-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-viaturas-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
