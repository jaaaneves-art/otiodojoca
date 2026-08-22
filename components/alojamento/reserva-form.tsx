'use client';

import { useState } from 'react';
import { criarReservaAlojamento } from '@/lib/alojamento/actions';
import type { TipoRefeicao } from '@/lib/alojamento/tipos';

interface Alojamento {
  id: number;
  nome: string;
  preco_noite: number;
}

interface RefeicaoOpcao {
  id: number;
  tipo_refeicao: string;
  preco_extra: number;
}

export default function ReservaForm({
  alojamento,
  refeicoes,
}: {
  alojamento: Alojamento;
  refeicoes: RefeicaoOpcao[];
}) {
  const [formData, setFormData] = useState({
    nome_hospede: '',
    email_hospede: '',
    telefone_hospede: '',
    data_entrada: '',
    data_saida: '',
    num_pessoas: 1,
    num_quartos: 1,
    tipo_refeicao: '',
    observacoes: '',
  });

  const [precoTotal, setPrecoTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Nº de noites — calculado automaticamente a partir das datas,
  // só para dar feedback visual imediato a quem faz a reserva.
  const numNoites = (() => {
    if (!formData.data_entrada || !formData.data_saida) return 0;
    const dataEntrada = new Date(formData.data_entrada);
    const dataSaida = new Date(formData.data_saida);
    const noites = Math.ceil(
      (dataSaida.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24)
    );
    return noites > 0 ? noites : 0;
  })();

  const calcularPreco = (entrada: string, saida: string, refeicao: string) => {
    if (!entrada || !saida) return;

    const dataEntrada = new Date(entrada);
    const dataSaida = new Date(saida);
    const noites = Math.ceil(
      (dataSaida.getTime() - dataEntrada.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (noites <= 0) {
      setError('Data de saída deve ser posterior à de entrada');
      setPrecoTotal(0);
      return;
    }

    let precoRefeicao = 0;
    if (refeicao) {
      const refeicaoSelecionada = refeicoes.find(
        (r) => r.tipo_refeicao === refeicao
      );
      if (refeicaoSelecionada) {
        precoRefeicao = refeicaoSelecionada.preco_extra || 0;
      }
    }

    const precoAlojamento = (alojamento.preco_noite * noites * formData.num_quartos);
    const precoRefeicaTotal = precoRefeicao * noites * formData.num_pessoas;
    const total = precoAlojamento + precoRefeicaTotal;

    setPrecoTotal(total);
    setError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'data_entrada' || name === 'data_saida' || name === 'tipo_refeicao') {
      const novoFormData = { ...formData, [name]: value };
      calcularPreco(
        novoFormData.data_entrada,
        novoFormData.data_saida,
        novoFormData.tipo_refeicao
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await criarReservaAlojamento({
        alojamento_id: alojamento.id,
        nome_hospede: formData.nome_hospede,
        email_hospede: formData.email_hospede,
        telefone_hospede: formData.telefone_hospede || undefined,
        data_entrada: formData.data_entrada,
        data_saida: formData.data_saida,
        num_pessoas: Number(formData.num_pessoas),
        num_quartos: Number(formData.num_quartos),
        tipo_refeicao: formData.tipo_refeicao as TipoRefeicao,
        preco_total: precoTotal,
        observacoes: formData.observacoes || undefined,
      });

      setSuccess('Reserva criada com sucesso! Vai receber confirmação em breve.');
      setFormData({
        nome_hospede: '',
        email_hospede: '',
        telefone_hospede: '',
        data_entrada: '',
        data_saida: '',
        num_pessoas: 1,
        num_quartos: 1,
        tipo_refeicao: '',
        observacoes: '',
      });
      setPrecoTotal(0);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6">Reservar: {alojamento.nome}</h1>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Nome *</label>
            <input
              type="text"
              name="nome_hospede"
              value={formData.nome_hospede}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Email *</label>
            <input
              type="email"
              name="email_hospede"
              value={formData.email_hospede}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Telefone</label>
          <input
            type="tel"
            name="telefone_hospede"
            value={formData.telefone_hospede}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">Data Entrada *</label>
            <input
              type="date"
              name="data_entrada"
              value={formData.data_entrada}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Data Saída *</label>
            <input
              type="date"
              name="data_saida"
              value={formData.data_saida}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold mb-2">Nº Noites *</label>
            <input
              type="text"
              value={numNoites > 0 ? numNoites : ''}
              readOnly
              disabled
              placeholder="Selecione as datas"
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Calculado automaticamente pelas datas</p>
          </div>
          <div>
            <label className="block font-semibold mb-2">Nº Pessoas *</label>
            <input
              type="number"
              name="num_pessoas"
              value={formData.num_pessoas}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-2">Nº Quartos *</label>
            <input
              type="number"
              name="num_quartos"
              value={formData.num_quartos}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-2">Tipo de Refeição *</label>
          <select
            name="tipo_refeicao"
            value={formData.tipo_refeicao}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Selecione uma refeição</option>
            <option value="sem_refeicoes">Não quero nenhuma refeição</option>
            <option value="incluido">Refeição incluída (sem custo extra)</option>
            {refeicoes.map((ref) => (
              <option key={ref.id} value={ref.tipo_refeicao}>
                {ref.tipo_refeicao} (+€{ref.preco_extra || 0}/pessoa/noite)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-2">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <div className="text-2xl font-bold">
            Preço Total: €{precoTotal.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Alojamento: €{alojamento.preco_noite}/noite
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'A guardar...' : 'Fazer Reserva'}
        </button>
      </form>
    </div>
  );
}
