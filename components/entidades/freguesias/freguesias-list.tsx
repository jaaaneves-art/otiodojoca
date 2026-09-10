'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';
import type { FreguesiaResumo } from '@/lib/freguesia/actions';

interface FreguesiasListProps {
  freguesias: FreguesiaResumo[];
}

export function FreguesiasList({ freguesias }: FreguesiasListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase();
    if (!termo) return freguesias;

    return freguesias.filter(
      (freguesia) =>
        freguesia.nome.toLowerCase().includes(termo) ||
        freguesia.municipio.toLowerCase().includes(termo)
    );
  }, [freguesias, searchTerm]);

  const grupos = useMemo(() => {
    const porMunicipio = new Map<string, FreguesiaResumo[]>();

    for (const freguesia of filtered) {
      const lista = porMunicipio.get(freguesia.municipio) ?? [];
      lista.push(freguesia);
      porMunicipio.set(freguesia.municipio, lista);
    }

    return Array.from(porMunicipio.entries()).sort(([a], [b]) =>
      a.localeCompare(b, 'pt')
    );
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-gray-600">
          {filtered.length} de {freguesias.length} freguesias
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <Input
          placeholder="Procurar por freguesia ou concelho..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {grupos.length > 0 ? (
        <div className="space-y-8">
          {grupos.map(([municipio, freguesiasDoMunicipio]) => (
            <div key={municipio}>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                {municipio}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {freguesiasDoMunicipio.map((freguesia) => (
                  <Link key={freguesia.id} href={`/freguesia/${freguesia.cod_ine}`}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                      <CardContent className="pt-6">
                        <p className="font-medium text-gray-900">{freguesia.nome}</p>
                        <p className="text-sm text-gray-500">{freguesia.cod_ine}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Nenhuma freguesia encontrada para os critérios de pesquisa.
          </p>
        </div>
      )}
    </div>
  );
}
