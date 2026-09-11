// components/marketplace/beleza-form.tsx
// CORRIGIDO 08/09/2026 — ver retailing-form.tsx para a nota sobre
// Textarea/CAE; a mesma correção aplica-se aqui.
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CaeAutocomplete } from '@/components/marketplace/cae-autocomplete';
import { criarBeleza, atualizarBeleza } from '@/lib/marketplace/beleza-actions';
import {
  BelezaFormData,
  CATEGORIA_BELEZA,
  CATEGORIA_NOMES,
  SERVICOS_POR_CATEGORIA,
  CategoriaBeleza,
  BelezaDisplay,
} from '@/lib/marketplace/beleza-types';

const TEXTAREA_CLASS =
  'flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent';

interface BelezaFormProps {
  userId: string;
  modo: 'criar' | 'editar';
  categoriaPadrao?: CategoriaBeleza;
  servicoExistente?: BelezaDisplay;
}

export function BelezaForm({ userId, modo, categoriaPadrao = 'cabelo', servicoExistente }: BelezaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState(servicoExistente?.nome || '');
  const [categoria, setCategoria] = useState<CategoriaBeleza>(servicoExistente?.categoria || categoriaPadrao);
  const [descricao, setDescricao] = useState(servicoExistente?.descricao || '');
  const [cae, setCae] = useState(servicoExistente?.cae || '');
  const [telefone, setTelefone] = useState(servicoExistente?.telefone || '');
  const [email, setEmail] = useState(servicoExistente?.email || '');
  const [endereco, setEndereco] = useState(servicoExistente?.endereco || '');
  const [profissionais, setProfissionais] = useState(servicoExistente?.profissionais || '');

  const [servicos, setServicos] = useState<string[]>(servicoExistente?.servicos || []);
  const [servicosComPreco, setServicosComPreco] = useState(servicoExistente?.servicos_com_preco || []);

  const [horarios, setHorarios] = useState(
    servicoExistente?.horarios || {
      seg: '09:00-18:00',
      ter: '09:00-18:00',
      qua: '09:00-18:00',
      qui: '09:00-18:00',
      sex: '09:00-18:00',
      sab: '10:00-14:00',
      dom: '',
    }
  );

  const [aceita_agendamento_online, setAceitaAgendamentoOnline] = useState(
    servicoExistente?.aceita_agendamento_online || false
  );
  const [link_agendamento, setLinkAgendamento] = useState(servicoExistente?.link_agendamento || '');

  const [fotos, setFotos] = useState<File[]>([]);

  const servicosDisponiveis = useMemo(() => SERVICOS_POR_CATEGORIA[categoria], [categoria]);

  const toggleServico = (servico: string) => {
    setServicos((prev) => (prev.includes(servico) ? prev.filter((s) => s !== servico) : [...prev, servico]));
  };

  const adicionarServicosComPreco = (servico: string) => {
    if (!servicosComPreco.find((s) => s.nome === servico)) {
      setServicosComPreco([...servicosComPreco, { nome: servico, preco: 0, duracao_minutos: 30 }]);
    }
  };

  const removerServicosComPreco = (servico: string) => {
    setServicosComPreco(servicosComPreco.filter((s) => s.nome !== servico));
  };

  const atualizarServicosComPreco = (idx: number, campo: 'preco' | 'duracao_minutos', valor: number) => {
    const novo = [...servicosComPreco];
    if (campo === 'preco') novo[idx].preco = valor;
    else novo[idx].duracao_minutos = valor;
    setServicosComPreco(novo);
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
      const dados: BelezaFormData = {
        nome,
        categoria,
        descricao,
        cae: cae || undefined,
        telefone,
        email,
        endereco,
        profissionais,
        servicos,
        servicos_com_preco: servicosComPreco.length > 0 ? servicosComPreco : undefined,
        horarios,
        aceita_agendamento_online,
        link_agendamento: link_agendamento || undefined,
        fotos: fotos.length > 0 ? fotos : undefined,
      };

      const resultado =
        modo === 'criar' ? await criarBeleza(dados) : await atualizarBeleza(servicoExistente!.id, dados);

      if (resultado.sucesso) {
        router.push('/beleza/' + categoria + '/' + resultado.id);
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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{modo === 'criar' ? 'Novo Serviço de Beleza' : 'Editar Serviço'}</h1>

      {erro && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">{erro}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECÇÃO 1: Identificação */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Identificação</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Serviço *</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaBeleza)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                {CATEGORIA_BELEZA.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORIA_NOMES[cat]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Seleciona o tipo de serviço que ofereces</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nome do Estabelecimento *</label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Salão da Maria"
                required
                minLength={5}
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">5-100 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreve o teu estabelecimento, especialidades, etc."
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
                placeholder="912345678"
                required
                pattern="(\d{9}|\+351\d{9})"
              />
              <p className="text-xs text-gray-500 mt-1">9 dígitos ou +351</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="salao@exemplo.com" required />
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
            </div>
          </div>
        </Card>

        {/* SECÇÃO 3: Serviços */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Serviços ({CATEGORIA_NOMES[categoria]}) *</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {servicosDisponiveis.map((servico) => (
              <label key={servico} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={servicos.includes(servico)} onChange={() => toggleServico(servico)} className="rounded" />
                <span className="text-sm">{servico}</span>
              </label>
            ))}
          </div>

          {servicos.length === 0 && <p className="text-sm text-red-600 mt-2">Escolhe pelo menos um serviço</p>}
        </Card>

        {/* SECÇÃO 4: Preços por Serviço */}
        {servicos.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Preços (Opcional)</h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">Adiciona preços para os serviços que ofereces</p>

              {servicos.map((servico) => (
                <div key={servico} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">{servico}</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={servicosComPreco.find((s) => s.nome === servico)?.preco || ''}
                        onChange={(e) => {
                          const idx = servicosComPreco.findIndex((s) => s.nome === servico);
                          if (idx >= 0) {
                            atualizarServicosComPreco(idx, 'preco', parseFloat(e.target.value));
                          } else {
                            adicionarServicosComPreco(servico);
                          }
                        }}
                        placeholder="Preço em €"
                        step="0.01"
                        min="0"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        value={servicosComPreco.find((s) => s.nome === servico)?.duracao_minutos || ''}
                        onChange={(e) => {
                          const idx = servicosComPreco.findIndex((s) => s.nome === servico);
                          if (idx >= 0) {
                            atualizarServicosComPreco(idx, 'duracao_minutos', parseInt(e.target.value));
                          }
                        }}
                        placeholder="min"
                        min="5"
                        max="180"
                        className="w-16"
                      />
                      <button
                        type="button"
                        onClick={() => removerServicosComPreco(servico)}
                        className="text-xs text-red-600 hover:text-red-800 whitespace-nowrap"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* SECÇÃO 5: Equipa */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Equipa</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Profissionais</label>
            <textarea
              value={profissionais}
              onChange={(e) => setProfissionais(e.target.value)}
              placeholder={'Maria Silva\nJoão Santos'}
              rows={3}
              maxLength={500}
              className={TEXTAREA_CLASS}
            />
            <p className="text-xs text-gray-500 mt-1">Um por linha, máximo 500 caracteres</p>
          </div>
        </Card>

        {/* SECÇÃO 6: Horários */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Horários</h2>

          <div className="space-y-3">
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((dia) => (
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
                  placeholder="09:00-18:00 (opcional)"
                  pattern="\d{2}:\d{2}-\d{2}:\d{2}"
                />
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">Formato: HH:MM-HH:MM (ex: 09:00-18:00). Deixa em branco se fechado.</p>
        </Card>

        {/* SECÇÃO 7: Agendamento Online */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Agendamento Online</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aceita_agendamento_online}
                onChange={(e) => setAceitaAgendamentoOnline(e.target.checked)}
                className="rounded"
              />
              <span>Ofereces agendamento online</span>
            </label>

            {aceita_agendamento_online && (
              <div>
                <label className="block text-sm font-medium mb-1">Link para Agendamento</label>
                <Input
                  type="url"
                  value={link_agendamento}
                  onChange={(e) => setLinkAgendamento(e.target.value)}
                  placeholder="https://calendly.com/seu-salao"
                />
                <p className="text-xs text-gray-500 mt-1">Calendly, Agend.ar, etc</p>
              </div>
            )}
          </div>
        </Card>

        {/* SECÇÃO 8: Fotos */}
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
                file:bg-pink-50 file:text-pink-700
                hover:file:bg-pink-100"
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
          <Button type="submit" disabled={loading} size="lg" className="flex-1 bg-pink-600 hover:bg-pink-700">
            {loading ? 'Processando...' : modo === 'criar' ? 'Criar Serviço' : 'Atualizar Serviço'}
          </Button>

          <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
