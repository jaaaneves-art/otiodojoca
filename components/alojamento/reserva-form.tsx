// components/alojamento/reserva-form.tsx

'use client';

import { useState } from 'react';
import type { AlojamentoComRefeicoes, TipoRefeicao } from '@/lib/alojamento/tipos';
import { criarReservaAlojamento, calcularPrecoReserva } from '@/lib/alojamento/actions';

interface ReservaFormProps {
  alojamento: AlojamentoComRefeicoes;
}

export default function ReservaForm({ alojamento }: ReservaFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nome_hospede: '',
    email_hospede: '',
    telefone_hospede: '',
    data_entrada: '',
    data_saida: '',
    num_pessoas: 1,
    num_quartos: 1,
    tipo_refeicao: 'sem_refeicoes' as TipoRefeicao,
    observacoes: '',
  });

  const [precoCalculado, setPrecoCalculado] = useState<{
    numNoites: number;
    precoNoite: number;
    precoRefeicoes: number;
    precoTotal: number;
  } | null>(null);

  // Calcular preço quando datas ou refeições mudam
  const calcularPreco = async () => {
    if (!formData.data_entrada || !formData.data_saida) return;

    try {
      const resultado = await calcularPrecoReserva(
        alojamento.id,
        formData.data_entrada,
        formData.data_saida,
        formData.tipo_refeicao
      );
      setPrecoCalculado(resultado);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular preço');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith('num_') ? parseInt(value) : value,
    }));
  };

  const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Recalcular quando datas ou refeições mudam
  const handleDataEntradaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDataChange(e);
    setTimeout(() => calcularPreco(), 100);
  };

  const handleDataSaidaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDataChange(e);
    setTimeout(() => calcularPreco(), 100);
  };

  const handleRefeicoesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleInputChange(e);
    setTimeout(() => calcularPreco(), 100);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (!precoCalculado) {
        throw new Error('Calcule o preço primeiro');
      }

      await criarReservaAlojamento({
        alojamento_id: alojamento.id,
        nome_hospede: formData.nome_hospede,
        email_hospede: formData.email_hospede,
        telefone_hospede: formData.telefone_hospede || undefined,
        data_entrada: formData.data_entrada,
        data_saida: formData.data_saida,
        num_pessoas: formData.num_pessoas,
        num_quartos: formData.num_quartos,
        tipo_refeicao: formData.tipo_refeicao,
        preco_total: precoCalculado.precoTotal,
        observacoes: formData.observacoes || undefined,
      });

      setSuccess(true);
      setFormData({
        nome_hospede: '',
        email_hospede: '',
        telefone_hospede: '',
        data_entrada: '',
        data_saida: '',
        num_pessoas: 1,
        num_quartos: 1,
        tipo_refeicao: 'sem_refeicoes',
        observacoes: '',
      });
      setPrecoCalculado(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Fazer Reserva</h2>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✅ Reserva criada com sucesso! Verifique seu email.
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados do Hóspede */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input
            type="text"
            name="nome_hospede"
            value={formData.nome_hospede}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            name="email_hospede"
            value={formData.email_hospede}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input
            type="tel"
            name="telefone_hospede"
            value={formData.telefone_hospede}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+351 2XX XXX XXX"
          />
        </div>

        {/* Datas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Entrada *</label>
          <input
            type="date"
            name="data_entrada"
            value={formData.data_entrada}
            onChange={handleDataEntradaChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Saída *</label>
          <input
            type="date"
            name="data_saida"
            value={formData.data_saida}
            onChange={handleDataSaidaChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Capacidade */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pessoas *</label>
            <input
              type="number"
              name="num_pessoas"
              value={formData.num_pessoas}
              onChange={handleInputChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quartos *</label>
            <input
              type="number"
              name="num_quartos"
              value={formData.num_quartos}
              onChange={handleInputChange}
              min="1"
              max={alojamento.num_quartos}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Refeições */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Refeições</label>
          <select
            name="tipo_refeicao"
            value={formData.tipo_refeicao}
            onChange={handleRefeicoesChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="sem_refeicoes">Sem refeições</option>
            {alojamento.refeicoes.some(r => r.tipo_refeicao === 'pequeno_almoco') && (
              <option value="pequeno_almoco">Pequeno-almoço incluído</option>
            )}
            {alojamento.refeicoes.length >= 2 && (
              <option value="meia_pensao">Meia-pensão (almoço + alojamento)</option>
            )}
            {alojamento.refeicoes.length === 3 && (
              <option value="pensao_completa">Pensão completa (3 refeições)</option>
            )}
          </select>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Informações adicionais..."
          />
        </div>

        {/* Preço */}
        {precoCalculado && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-sm">
                <span>Noites:</span>
                <span className="font-medium">{precoCalculado.numNoites}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>€{precoCalculado.precoNoite.toFixed(2)} × {precoCalculado.numNoites}</span>
                <span className="font-medium">€{(precoCalculado.precoNoite * precoCalculado.numNoites).toFixed(2)}</span>
              </div>
              {precoCalculado.precoRefeicoes > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Refeições:</span>
                  <span className="font-medium">€{precoCalculado.precoRefeicoes.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold text-blue-700">
              <span>Total:</span>
              <span>€{precoCalculado.precoTotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Botão Submit */}
        <button
          type="submit"
          disabled={loading || !precoCalculado}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Processando...' : 'Confirmar Reserva'}
        </button>
      </form>
    </div>
  );
}
