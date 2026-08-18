'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { criarReserva } from '@/lib/comer/actions';

interface ReservaFormProps {
  restauranteId: number;
  restauranteNome: string;
}

function getTodayString() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export default function ReservaForm({ restauranteId }: ReservaFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [aCarregarUser, setACarregarUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    nome_cliente: '',
    email_cliente: '',
    telefone: '',
    data_reserva: '',
    hora_reserva: '',
    numero_pessoas: 2,
    observacoes: '',
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setACarregarUser(false);
      if (user?.email) {
        setFormData(prev => ({ ...prev, email_cliente: user.email! }));
      }
    });
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'numero_pessoas' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setMensagem('');

    if (formData.data_reserva < getTodayString()) {
      setErro('Não é possível fazer reservas para o passado.');
      return;
    }

    setLoading(true);
    try {
      const result = await criarReserva({ restaurante_id: restauranteId, ...formData });
      if (result.sucesso) {
        setMensagem('Reserva criada com sucesso!');
        setFormData({ nome_cliente: '', email_cliente: '', telefone: '', data_reserva: '', hora_reserva: '', numero_pessoas: 2, observacoes: '' });
      } else {
        setErro(result.erro || 'Erro ao criar reserva');
      }
    } catch {
      setErro('Erro ao processar reserva.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelCls = "block text-sm font-medium text-orange-900 mb-1";

  if (aCarregarUser) {
    return (
      <div className="bg-orange-50 p-8 rounded-lg border border-orange-200 mt-8">
        <p className="text-orange-700">A verificar sessão...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-orange-50 p-8 rounded-lg border border-orange-200 mt-8">
        <h2 className="text-2xl font-semibold text-orange-900 mb-4">📅 Fazer Reserva</h2>
        <p className="text-orange-900">
          <strong>Faça login para reservar uma mesa.</strong>
        </p>
        <a href="/login" className="mt-3 inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold">
          Ir para Login
        </a>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 p-8 rounded-lg border border-orange-200 mt-8">
      <h2 className="text-2xl font-semibold text-orange-900 mb-6">📅 Fazer Reserva</h2>

      {mensagem && <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-800 rounded-lg">✅ {mensagem}</div>}
      {erro && <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-800 rounded-lg">❌ {erro}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nome</label>
            <input type="text" name="nome_cliente" value={formData.nome_cliente} onChange={handleChange} required className={inputCls} placeholder="Seu nome" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" name="email_cliente" value={formData.email_cliente} readOnly required className={inputCls + " bg-orange-100"} />
          </div>
          <div>
            <label className={labelCls}>Telefone</label>
            <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} required className={inputCls} placeholder="+351 XXX XXX XXX" />
          </div>
          <div>
            <label className={labelCls}>Pessoas</label>
            <select name="numero_pessoas" value={formData.numero_pessoas} onChange={handleChange} className={inputCls}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Data</label>
            <input type="date" name="data_reserva" value={formData.data_reserva} onChange={handleChange} min={getTodayString()} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hora</label>
            <input type="time" name="hora_reserva" value={formData.hora_reserva} onChange={handleChange} required className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Observações</label>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className={inputCls} placeholder="Alergias, preferências..." />
        </div>
        <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-semibold disabled:opacity-50">
          {loading ? 'A processar...' : 'Confirmar Reserva'}
        </button>
      </form>
    </div>
  );
}
