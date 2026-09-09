// components/marketplace/consultorio-form.tsx
// CORRIGIDO 08/09/2026 — ver retailing-form.tsx para a nota sobre
// Textarea/CAE; a mesma correção aplica-se aqui.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CaeAutocomplete } from '@/components/marketplace/cae-autocomplete';
import { criarConsultorio, atualizarConsultorio } from '@/lib/marketplace/consultorio-actions';
import { ConsultorioFormData, ESPECIALIDADES, DIAS_SEMANA, ConsultorioDisplay } from '@/lib/marketplace/consultorio-types';

const TEXTAREA_CLASS =
  'flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent';

interface ConsultorioFormProps {
  userId: string;
  modo: 'criar' | 'editar';
  consultorioExistente?: ConsultorioDisplay;
}

export function ConsultorioForm({ userId, modo, consultorioExistente }: ConsultorioFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(consultorioExistente?.nome || '');
  const [descricao, setDescricao] = useState(consultorioExistente?.descricao || '');
  const [cae, setCae] = useState(consultorioExistente?.cae || '');
  const [telefone, setTelefone] = useState(consultorioExistente?.telefone || '');
  const [email, setEmail] = useState(consultorioExistente?.email || '');
  const [endereco, setEndereco] = useState(consultorioExistente?.endereco || '');
  const [profissionais, setProfissionais] = useState(consultorioExistente?.profissionais || '');

  const [especialidades, setEspecialidades] = useState<string[]>(consultorioExistente?.especialidades || []);

  const [horarios, setHorarios] = useState(
    consultorioExistente?.horarios || {
      seg: '09:00-12:00,14:00-18:00',
      ter: '09:00-12:00,14:00-18:00',
      qua: '09:00-12:00,14:00-18:00',
      qui: '09:00-12:00,14:00-18:00',
      sex: '09:00-12:00,14:00-18:00',
      sab: '10:00-13:00',
      dom: '',
    }
  );

  const [aceita_seguros, setAceitaSeguros] = useState(consultorioExistente?.aceita_seguros || false);
  const [preco_consulta, setPrecoConsulta] = useState(consultorioExistente?.preco_consulta?.toString() || '');

  const [fotos, setFotos] = useState<File[]>([]);

  const toggleEspecialidade = (esp: string) => {
    setEspecialidades((prev) => (prev.includes(esp) ? prev.filter((e) => e !== esp) : [...prev, esp]));
  };

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const novos = Array.from(e.target.files || []);
    setFotos((prev) => [...prev, ...novos].slice(0, 3));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const dados: ConsultorioFormData = {
        nome,
        descricao,
        cae: cae || undefined,
        telefone,
        email,
        endereco,
        profissionais,
        especialidades: especialidades as ConsultorioFormData['especialidades'],
        horarios,
        aceita_seguros,
        preco_consulta: preco_consulta ? parseFloat(preco_consulta) : undefined,
        fotos: fotos.length > 0 ? fotos : undefined,
      };

      const resultado =
        modo === 'criar'
          ? await criarConsultorio(dados, userId)
          : await atualizarConsultorio(consultorioExistente!.id, dados, userId);

      if (resultado.sucesso) {
        router.push('/consultorios/' + resultado.id);
        router.refresh();
      } else {
        setErro(resultado.erro || 'Erro desconhecido');
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao processar form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{modo === 'criar' ? 'Criar Consultório' : 'Editar Consultório'}</h1>

      {erro && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{erro}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECÇÃO 1: Informações Básicas */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Consultório *</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Clínica São João"
                required
                minLength={5}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 5, máximo 100 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreve o consultório, serviços especiais, etc."
                maxLength={500}
                rows={4}
                className={TEXTAREA_CLASS}
              />
              <p className="text-xs text-gray-500 mt-1">{descricao.length}/500 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="cae">
                Atividade Económica (CAE)
              </label>
              <CaeAutocomplete id="cae" value={cae} onChange={setCae} />
            </div>
          </div>
        </Card>

        {/* SECÇÃO 2: Contacto */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Telefone *</label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="912345678 ou +351912345678"
                required
                pattern="(\d{9}|\+351\d{9})"
              />
              <p className="text-xs text-gray-500 mt-1">9 dígitos ou +351 + 9 dígitos</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="consultorio@exemplo.com"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Endereço Completo *</label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, localidade, código postal"
                required
                minLength={10}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">Será usado para mapa/localização</p>
            </div>
          </div>
        </Card>

        {/* SECÇÃO 3: Especialidades */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Especialidades *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ESPECIALIDADES.map((esp) => (
              <label key={esp} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={especialidades.includes(esp)} onChange={() => toggleEspecialidade(esp)} className="rounded" />
                <span className="text-sm">{esp}</span>
              </label>
            ))}
          </div>

          {especialidades.length === 0 && <p className="text-sm text-red-600 mt-2">Escolhe pelo menos uma especialidade</p>}
        </Card>

        {/* SECÇÃO 4: Equipa */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Equipa Profissional</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Nomes dos Médicos / Profissionais</label>
            <textarea
              value={profissionais}
              onChange={(e) => setProfissionais(e.target.value)}
              placeholder={'Dr. João Silva\nDra. Maria Santos'}
              rows={3}
              maxLength={500}
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-gray-500 mt-1">Um por linha, máximo 500 caracteres</p>
          </div>
        </Card>

        {/* SECÇÃO 5: Horários */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Horários</h2>

          <div className="space-y-3">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia}>
                <label className="block text-sm font-medium mb-1 capitalize">
                  {dia === 'seg' && 'Segunda'}
                  {dia === 'ter' && 'Terça'}
                  {dia === 'qua' && 'Quarta'}
                  {dia === 'qui' && 'Quinta'}
                  {dia === 'sex' && 'Sexta'}
                  {dia === 'sab' && 'Sábado'}
                  {dia === 'dom' && 'Domingo'}
                </label>
                <Input
                  value={horarios[dia as keyof typeof horarios] || ''}
                  onChange={(e) => setHorarios((prev) => ({ ...prev, [dia]: e.target.value }))}
                  placeholder="09:00-12:00,14:00-18:00 (opcional)"
                  pattern="(\d{2}:\d{2}-\d{2}:\d{2}(,\d{2}:\d{2}-\d{2}:\d{2})*)?"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Formato: HH:MM-HH:MM (ex: 09:00-18:00). Múltiplos períodos separados por vírgula (ex:
            09:00-12:00,14:00-18:00). Deixa em branco se fechado.
          </p>
        </Card>

        {/* SECÇÃO 6: Seguros e Preço */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Seguros e Preços</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={aceita_seguros} onChange={(e) => setAceitaSeguros(e.target.checked)} className="rounded" />
              <span>Aceita seguros de saúde</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1">Preço da Consulta (em €)</label>
              <Input
                type="number"
                value={preco_consulta}
                onChange={(e) => setPrecoConsulta(e.target.value)}
                placeholder="50.00"
                step="0.01"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">Opcional</p>
            </div>
          </div>
        </Card>

        {/* SECÇÃO 7: Fotos */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Fotos</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Upload de Imagens (máximo 3)</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFotosChange}
              disabled={fotos.length >= 3}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />

            {fotos.length > 0 && (
              <div className="mt-4 space-y-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">{foto.name}</span>
                    <button
                      type="button"
                      onClick={() => setFotos((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">{fotos.length}/3 fotos selecionadas</p>
          </div>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} size="lg" className="flex-1">
            {loading ? 'Processando...' : modo === 'criar' ? 'Criar Consultório' : 'Atualizar Consultório'}
          </Button>

          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
