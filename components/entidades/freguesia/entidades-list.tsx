'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EntidadeCard } from './entidade-card';
import { Search } from 'lucide-react';
import type { EntidadeComCategoria } from '@/lib/freguesia/actions';

interface Categoria {
  id: number;
  nome: string;
  icone?: string;
}

interface EntidadesListProps {
  entidades: EntidadeComCategoria[];
  categorias: Categoria[];
  frequesiaNome: string;
}

export function EntidadesList({
  entidades,
  categorias,
  frequesiaNome,
}: EntidadesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);

  const filteredEntidades = entidades.filter((entidade) => {
    const matchSearch =
      entidade.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entidade.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategoria =
      !selectedCategoria || entidade.categoria_id === selectedCategoria;

    return matchSearch && matchCategoria;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Entidades em {frequesiaNome}</h1>
        <p className="text-gray-600">
          {filteredEntidades.length} de {entidades.length} entidades
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Procurar por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtro de Categorias */}
      {categorias.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Categorias</h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={selectedCategoria === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategoria(null)}
            >
              Todas
            </Badge>
            {categorias.map((categoria) => (
              <Badge
                key={categoria.id}
                variant={selectedCategoria === categoria.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategoria(categoria.id)}
              >
                {categoria.icone && <span className="mr-1">{categoria.icone}</span>}
                {categoria.nome}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Entidades */}
      {filteredEntidades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntidades.map((entidade) => (
            <EntidadeCard
              key={entidade.id}
              {...entidade}
              categoria={entidade.categorias_entidade}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhuma entidade encontrada para os critérios de pesquisa.
          </p>
        </div>
      )}
    </div>
  );
}
