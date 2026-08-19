'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Globe } from 'lucide-react';

interface EntidadeCardProps {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
  categoria?: {
    nome: string;
    icone?: string;
  };
  telefone?: string;
  email?: string;
  website?: string;
}

export function EntidadeCard({
  nome,
  slug,
  descricao,
  categoria,
  telefone,
  email,
  website,
}: EntidadeCardProps) {
  const router = useRouter();

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/freguesias/${slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/freguesias/${slug}`);
        }
      }}
      className="hover:shadow-lg transition-shadow cursor-pointer h-full"
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{nome}</CardTitle>
            {categoria && (
              <Badge variant="secondary" className="mt-2">
                {categoria.icone && <span className="mr-1">{categoria.icone}</span>}
                {categoria.nome}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {descricao && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{descricao}</p>
        )}

        <div className="space-y-2">
          {telefone && (
            <div className="flex items-center text-sm text-gray-700">
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              <a href={`tel:${telefone}`} onClick={(e) => e.stopPropagation()}>
                {telefone}
              </a>
            </div>
          )}

          {email && (
            <div className="flex items-center text-sm text-gray-700">
              <Mail className="w-4 h-4 mr-2 text-blue-600" />
              <a href={`mailto:${email}`} onClick={(e) => e.stopPropagation()}>
                {email}
              </a>
            </div>
          )}

          {website && (
            <div className="flex items-center text-sm text-gray-700">
              <Globe className="w-4 h-4 mr-2 text-blue-600" />
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Visitar website
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
