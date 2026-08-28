"use client";

import { useState } from "react";
import ImageUpload from "@/components/mercado-da-terra/image-upload";
import { MunicipioAutocomplete } from "@/components/mercado-da-terra/municipio-autocomplete";
import { IMOVEL_AD_TYPES, getImovelAdType, PROPERTY_CONDITIONS, COMODIDADES_QUARTO } from "@/lib/imoveis/ad-types";

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
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  year_built?: number | null;
  property_condition?: string | null;
  auction_start_price?: number | null;
  auction_minimum_increment?: number | null;
  /** ISO (UTC) — vem diretamente da coluna timestamptz da base de dados */
  auction_starts_at?: string | null;
  /** ISO (UTC) — idem */
  auction_ends_at?: string | null;
  auction_status?: string | null;
  mobilado?: string | null;
  despesas_incluidas?: string | null;
  caucao?: number | null;
  disponivel_desde?: string | null;
  duracao_minima?: number | null;
  para_estudantes?: boolean | string | null;
  vagas_disponiveis?: number | null;
  procura_em_troca?: string | null;
  aceita_com_diferenca?: boolean | string | null;
  apoio_esperado?: string | null;
  regras_da_casa?: string | null;
  tipo_quarto?: string | null;
  casa_banho?: string | null;
  pessoas_na_casa?: number | null;
  comodidades?: string | null;
  aceita_casais?: boolean | string | null;
}

// <input type="datetime-local"> não sabe nada de fusos-horários — mesma
// disciplina de bazar-ad-form.tsx: conversão sempre via getters *locais* do
// Date, sempre no browser. Ver o comentário completo lá.
function isoParaDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalParaIso(valor: string): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function ImovelAdForm({
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
  const config = getImovelAdType(tipo);
  const mostra = (campo: string) => config.fields.includes(campo as any);

  // Mesma regra do Gran Bazar: um leilão já agendado só pode ter os seus
  // parâmetros alterados enquanto ainda não começou. A base de dados impõe
  // isto via RLS (marketplace_auctions só aceita UPDATE do dono enquanto
  // status='scheduled'); isto aqui é só a experiência de utilizador
  // correspondente.
  const leilaoBloqueado = inicial?.type === "leilao" && !!inicial?.auction_status && inicial.auction_status !== "scheduled";

  const handleFilesSelected = (files: File[]) => {
    setUploadedFiles(files);
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-imoveis-200 space-y-4">
      <div>
        <label className="text-sm font-medium">Tipo de anúncio *</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
          {Object.values(IMOVEL_AD_TYPES).map((type) => (
            <button
              key={type.id}
              type="button"
              disabled={leilaoBloqueado}
              title={leilaoBloqueado ? "Este leilão já começou — o tipo já não pode ser alterado" : undefined}
              onClick={() => setTipo(type.id)}
              className={`py-2 px-3 rounded-lg border font-medium text-sm transition ${
                tipo === type.id
                  ? "bg-imoveis-600 border-imoveis-600 text-white"
                  : "border-imoveis-200 text-imoveis-800 hover:bg-imoveis-50"
              } ${leilaoBloqueado ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {type.icon} {type.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="type" value={tipo} />
      </div>

      <div>
        <label className="text-sm font-medium">Título *</label>
        <input
          name="title"
          defaultValue={inicial?.title ?? ""}
          placeholder="Ex: Apartamento T3 com vista rio"
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Descrição *</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={inicial?.description ?? ""}
          placeholder="Descreve o imóvel..."
          required
          className="w-full border rounded-lg p-2 mt-1"
        />
      </div>

      {mostra("categoryId") && (
        <div>
          <label className="text-sm font-medium">Tipo de imóvel *</label>
          <select
            name="categoryId"
            defaultValue={inicial?.category_id ?? ""}
            required
            className="w-full border rounded-lg p-2 mt-1"
          >
            <option value="">Seleciona um tipo</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {mostra("price") && (
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
            <label className="text-sm font-medium">
              {tipo === "arrendamento" || tipo === "quarto" ? "Renda mensal (EUR) *" : "Preço (EUR) *"}
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={inicial?.price ?? ""}
              placeholder={tipo === "arrendamento" || tipo === "quarto" ? "350" : "250000"}
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      )}

      {tipo !== "quarto" && (
      <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-4">
        <p className="text-sm font-semibold text-imoveis-900">🏠 Características do imóvel</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Área (m²) *</label>
            <input
              name="area"
              type="number"
              min="0"
              defaultValue={inicial?.area ?? ""}
              placeholder="90"
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Estado *</label>
            <select
              name="propertyCondition"
              defaultValue={inicial?.property_condition ?? "usado"}
              required
              className="w-full border rounded-lg p-2 mt-1"
            >
              {Object.entries(PROPERTY_CONDITIONS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Quartos</label>
            <input
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={inicial?.bedrooms ?? ""}
              placeholder="2"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">WC</label>
            <input
              name="bathrooms"
              type="number"
              min="0"
              defaultValue={inicial?.bathrooms ?? ""}
              placeholder="1"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Ano de construção</label>
            <input
              name="yearBuilt"
              type="number"
              min="1800"
              max="2100"
              defaultValue={inicial?.year_built ?? ""}
              placeholder="2005"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      </div>
      )}

      {mostra("tipoQuarto") && (
        <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-imoveis-900">🛏️ Detalhes do quarto</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Área do quarto (m²) *</label>
              <input
                name="area"
                type="number"
                min="0"
                defaultValue={inicial?.area ?? ""}
                placeholder="12"
                required
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Quartos na casa</label>
              <input
                name="bedrooms"
                type="number"
                min="0"
                defaultValue={inicial?.bedrooms ?? ""}
                placeholder="3"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de quarto *</label>
              <select
                name="tipoQuarto"
                defaultValue={inicial?.tipo_quarto ?? ""}
                required
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Seleciona</option>
                <option value="privado">Privado (só para ti)</option>
                <option value="partilhado">Partilhado (com outra pessoa)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Casa de banho *</label>
              <select
                name="casaBanho"
                defaultValue={inicial?.casa_banho ?? ""}
                required
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Seleciona</option>
                <option value="privada">Privada</option>
                <option value="partilhada">Partilhada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Pessoas a viver na casa</label>
              <input
                name="pessoasNaCasa"
                type="number"
                min="0"
                defaultValue={inicial?.pessoas_na_casa ?? ""}
                placeholder="Ex: 3, incluindo quem arrenda"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mobilado</label>
              <select
                name="mobilado"
                defaultValue={inicial?.mobilado ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Não especificado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Comodidades da casa</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              {COMODIDADES_QUARTO.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm border border-imoveis-200 rounded-lg p-2">
                  <input
                    type="checkbox"
                    name="comodidades"
                    value={c.value}
                    defaultChecked={inicial?.comodidades?.split(",").includes(c.value) ?? false}
                  />
                  {c.icon} {c.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Despesas incluídas</label>
              <select
                name="despesasIncluidas"
                defaultValue={inicial?.despesas_incluidas ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Não especificado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
                <option value="parcialmente">Parcialmente</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Caução (EUR)</label>
              <input
                name="caucao"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.caucao ?? ""}
                placeholder="Ex: 1 mês de renda"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Disponível a partir de</label>
              <input
                name="disponivelDesde"
                type="date"
                defaultValue={inicial?.disponivel_desde ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duração mínima (meses)</label>
              <input
                name="duracaoMinima"
                type="number"
                min="0"
                defaultValue={inicial?.duracao_minima ?? ""}
                placeholder="12"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="aceitaCasais" value="true" defaultChecked={!!inicial?.aceita_casais} />
            Aceita casais
          </label>

          <div>
            <label className="text-sm font-medium">Regras da casa</label>
            <textarea
              name="regrasDaCasa"
              rows={2}
              defaultValue={inicial?.regras_da_casa ?? ""}
              placeholder="Fumar, animais, visitas, horários..."
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="paraEstudantes" value="true" defaultChecked={!!inicial?.para_estudantes} />
            🎓 Dirigido a estudantes
          </label>
        </div>
      )}

      {mostra("mobilado") && tipo !== "quarto" && (
        <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-imoveis-900">🔑 Condições do arrendamento</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Mobilado</label>
              <select
                name="mobilado"
                defaultValue={inicial?.mobilado ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Não especificado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Despesas incluídas</label>
              <select
                name="despesasIncluidas"
                defaultValue={inicial?.despesas_incluidas ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              >
                <option value="">Não especificado</option>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
                <option value="parcialmente">Parcialmente</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Caução (EUR)</label>
              <input
                name="caucao"
                type="number"
                step="0.01"
                min="0"
                defaultValue={inicial?.caucao ?? ""}
                placeholder="Ex: 1 mês de renda"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Disponível a partir de</label>
              <input
                name="disponivelDesde"
                type="date"
                defaultValue={inicial?.disponivel_desde ?? ""}
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Duração mínima (meses)</label>
              <input
                name="duracaoMinima"
                type="number"
                min="0"
                defaultValue={inicial?.duracao_minima ?? ""}
                placeholder="12"
                className="w-full border rounded-lg p-2 mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {mostra("paraEstudantes") && tipo !== "quarto" && (
        <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="paraEstudantes" value="true" defaultChecked={!!inicial?.para_estudantes} />
            🎓 Dirigido a estudantes
          </label>
          <div>
            <label className="text-sm font-medium">Vagas disponíveis na casa</label>
            <input
              name="vagasDisponiveis"
              type="number"
              min="0"
              defaultValue={inicial?.vagas_disponiveis ?? ""}
              placeholder="Ex: 1, se for um quarto numa casa partilhada"
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
        </div>
      )}

      {mostra("procuraEmTroca") && (
        <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-imoveis-900">🔄 Permuta</p>
          <div>
            <label className="text-sm font-medium">O que procuras em troca? *</label>
            <textarea
              name="procuraEmTroca"
              rows={3}
              defaultValue={inicial?.procura_em_troca ?? ""}
              placeholder="Ex: apartamento T2 na mesma zona, ou terreno rústico"
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="aceitaComDiferenca" value="true" defaultChecked={!!inicial?.aceita_com_diferenca} />
            Aceito compensar/receber diferença em dinheiro
          </label>
        </div>
      )}

      {mostra("apoioEsperado") && (
        <div className="bg-imoveis-50 border border-imoveis-100 rounded-lg p-4 space-y-4">
          <p className="text-sm font-semibold text-imoveis-900">🤝 Troca por companhia</p>
          <div>
            <label className="text-sm font-medium">O que se espera da pessoa? *</label>
            <textarea
              name="apoioEsperado"
              rows={3}
              defaultValue={inicial?.apoio_esperado ?? ""}
              placeholder="Ex: companhia, pequenas tarefas domésticas, ajuda em deslocações..."
              required
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Regras da casa</label>
            <textarea
              name="regrasDaCasa"
              rows={2}
              defaultValue={inicial?.regras_da_casa ?? ""}
              placeholder="Horários, visitas, animais..."
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Duração mínima (meses)</label>
            <input
              name="duracaoMinima"
              type="number"
              min="0"
              defaultValue={inicial?.duracao_minima ?? ""}
              placeholder="Ex: 9, se for um ano letivo"
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
                placeholder="100000"
                required
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-imoveis-100 disabled:text-imoveis-500"
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
                defaultValue={inicial?.auction_minimum_increment ?? "1000.00"}
                placeholder="1000.00"
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-imoveis-100 disabled:text-imoveis-500"
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
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-imoveis-100 disabled:text-imoveis-500"
              />
              <p className="text-xs text-imoveis-600 mt-1">Deixa em branco para começar já</p>
            </div>
            <div>
              <label className="text-sm font-medium">Encerramento *</label>
              <input
                name="auctionEndsAt"
                type="datetime-local"
                disabled={leilaoBloqueado}
                defaultValue={isoParaDatetimeLocal(inicial?.auction_ends_at)}
                required
                className="w-full border rounded-lg p-2 mt-1 disabled:bg-imoveis-100 disabled:text-imoveis-500"
              />
            </div>
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
        className="w-full bg-imoveis-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-imoveis-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
