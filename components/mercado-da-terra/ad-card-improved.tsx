"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { useState } from "react";

interface Ad {
  id: number;
  title: string;
  description?: string;
  price: number | null;
  price_type: string;
  location: string | null;
  municipality?: string;
  status: string;
  author: { username: string; avatar_url?: string };
  created_at: string;
  images?: string[];
  category?: string;
  views_count?: number;
}

interface AdCardProps {
  ad: Ad;
  onFavorite?: (adId: number) => void;
  isFavorite?: boolean;
}

export function AdCard({ ad, onFavorite, isFavorite = false }: AdCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  
  const priceLabel = {
    fixed: `€${ad.price?.toFixed(2)}`,
    negotiable: `€${ad.price?.toFixed(2)} (negociável)`,
    free: "Grátis",
  };

  const statusLabel = {
    active: { label: "Ativo", color: "bg-green-100 text-green-700" },
    sold: { label: "Vendido", color: "bg-gray-100 text-gray-600" },
    reserved: { label: "Reservado", color: "bg-yellow-100 text-yellow-700" },
    expired: { label: "Expirado", color: "bg-red-100 text-red-600" },
    inactive: { label: "Inativo", color: "bg-terra-100 text-terra-600" },
  };

  const currentStatus = statusLabel[ad.status as keyof typeof statusLabel] || statusLabel.inactive;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    setFavorite(!favorite);
    onFavorite?.(ad.id);
  };

  const truncateDescription = (text?: string, length = 80) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <Link href={`/mercado-da-terra/${ad.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer h-full overflow-hidden hover:scale-105 duration-200">
        {/* Imagem do anúncio */}
        <div className="relative w-full h-48 bg-terra-100 flex items-center justify-center overflow-hidden">
          {ad.images && ad.images.length > 0 ? (
            <img
              src={ad.images[0]}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-terra-400 text-sm">Sem imagem</div>
          )}
          
          {/* Badge de status */}
          <div className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full font-semibold ${currentStatus.color}`}>
            {currentStatus.label}
          </div>

          {/* Botão favorito */}
          <button
            onClick={handleFavorite}
            className={`absolute top-2 left-2 p-2 rounded-full transition-colors ${
              favorite
                ? "bg-red-500 text-white"
                : "bg-white/80 text-terra-700 hover:bg-white"
            }`}
          >
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>

          {/* Badge de múltiplas imagens */}
          {ad.images && ad.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              +{ad.images.length - 1}
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Categoria */}
            {ad.category && (
              <p className="text-xs text-terra-500 uppercase tracking-wide font-semibold">
                {ad.category}
              </p>
            )}

            {/* Título */}
            <h3 className="font-semibold text-terra-800 line-clamp-2">{ad.title}</h3>

            {/* Descrição resumida */}
            {ad.description && (
              <p className="text-sm text-terra-600 line-clamp-2">
                {truncateDescription(ad.description, 60)}
              </p>
            )}

            {/* Preço */}
            <p className="text-lg font-bold text-terra-700">
              {priceLabel[ad.price_type as keyof typeof priceLabel] || "Preço sob consulta"}
            </p>

            {/* Localização */}
            {ad.location && (
              <p className="text-xs text-terra-500">
                📍 {ad.municipality || ad.location}
              </p>
            )}

            {/* Footer com autor e data */}
            <div className="flex items-center justify-between pt-2 border-t border-terra-100">
              <div className="flex items-center gap-2">
                {ad.author.avatar_url ? (
                  <img
                    src={ad.author.avatar_url}
                    alt={ad.author.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-terra-300 flex items-center justify-center text-xs font-bold text-terra-700">
                    {ad.author.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-terra-600">{ad.author.username}</span>
              </div>
              <span className="text-xs text-terra-400">
                {new Date(ad.created_at).toLocaleDateString("pt-PT")}
              </span>
            </div>

            {/* Views count */}
            {ad.views_count && (
              <p className="text-xs text-terra-400 text-center pt-1">
                👁️ {ad.views_count} visualizações
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
