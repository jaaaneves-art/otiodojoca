"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Flag, MapPin, Calendar, User, Star } from "lucide-react";
import Link from "next/link";

interface Ad {
  id: number;
  title: string;
  description: string;
  price: number | null;
  price_type: string;
  location: string;
  municipality: string;
  district: string;
  images: string[];
  category: string;
  subcategory: string;
  status: string;
  contact_method: string;
  created_at: string;
  views_count: number;
  author: {
    id: string;
    username: string;
    avatar_url: string;
    bio: string;
    rating: number;
    total_reviews: number;
  };
}

interface AdDetailProps {
  ad: Ad;
  onContactSeller?: () => void;
}

const statusColors = {
  active: "bg-green-100 text-green-700",
  sold: "bg-gray-100 text-gray-600",
  reserved: "bg-yellow-100 text-yellow-700",
  expired: "bg-red-100 text-red-600",
};

export function AdDetail({ ad, onContactSeller }: AdDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const priceLabel = {
    fixed: `€${ad.price?.toFixed(2)}`,
    negotiable: `€${ad.price?.toFixed(2)} (negociável)`,
    free: "Grátis",
  };

  const statusLabel = {
    active: "Ativo",
    sold: "Vendido",
    reserved: "Reservado",
    expired: "Expirado",
  };

  const contactMethods = {
    message: "💬 Mensagem privada",
    phone: "📞 Telefone",
    email: "📧 Email",
    in_person: "🤝 Presencialmente",
  };

  return (
    <div className="min-h-screen bg-terra-50">
      {/* Header com breadcrumb */}
      <div className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-sm text-terra-600">
            <Link href="/mercado-da-terra" className="hover:text-terra-800">Mercado da Terra</Link>
            <span className="mx-2">/</span>
            <span className="text-terra-800 font-medium">{ad.title}</span>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda - Imagens e informações principais */}
        <div className="lg:col-span-2">
          {/* Galeria de imagens */}
          <Card className="mb-6 overflow-hidden">
            <div className="relative bg-terra-100">
              {/* Imagem principal */}
              <div className="w-full aspect-square bg-terra-100 flex items-center justify-center overflow-hidden">
                <img
                  src={ad.images[selectedImage]}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Botão favoritar */}
              <button
                onClick={() => setFavorite(!favorite)}
                className={`absolute top-4 left-4 p-3 rounded-full transition-colors ${
                  favorite
                    ? "bg-red-500 text-white"
                    : "bg-white/80 text-terra-700 hover:bg-white"
                }`}
              >
                <Heart size={24} fill={favorite ? "currentColor" : "none"} />
              </button>

              {/* Status badge */}
              <div
                className={`absolute top-4 right-4 px-3 py-1 rounded-full font-semibold text-sm ${
                  statusColors[ad.status as keyof typeof statusColors]
                }`}
              >
                {statusLabel[ad.status as keyof typeof statusLabel]}
              </div>

              {/* Contador de imagens */}
              {ad.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImage + 1} / {ad.images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {ad.images.length > 1 && (
              <div className="p-4 border-t border-terra-200 flex gap-2 overflow-x-auto">
                {ad.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx
                        ? "border-terra-600"
                        : "border-terra-200 hover:border-terra-400"
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Informações do anúncio */}
          <Card>
            <CardContent className="pt-6">
              {/* Título e Preço */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-terra-900 mb-2">{ad.title}</h1>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-terra-700">
                    {priceLabel[ad.price_type as keyof typeof priceLabel]}
                  </p>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-4 py-2 text-terra-700 hover:bg-terra-100 rounded-lg transition">
                      <Share2 size={18} />
                      <span className="text-sm">Partilhar</span>
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Flag size={18} />
                      <span className="text-sm">Denunciar</span>
                    </button>
                  </div>
                </div>
              </div>

              <hr className="my-6" />

              {/* Metadados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 text-terra-600">
                  <MapPin size={18} />
                  <span className="text-sm">{ad.municipality}</span>
                </div>
                <div className="flex items-center gap-2 text-terra-600">
                  <Calendar size={18} />
                  <span className="text-sm">{new Date(ad.created_at).toLocaleDateString("pt-PT")}</span>
                </div>
                <div className="flex items-center gap-2 text-terra-600">
                  <span className="text-sm">👁️ {ad.views_count} views</span>
                </div>
                <div className="flex items-center gap-2 text-terra-600">
                  <span className="text-sm">{ad.category}</span>
                </div>
              </div>

              <hr className="my-6" />

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {ad.category && (
                  <span className="px-3 py-1 bg-terra-100 text-terra-700 text-sm rounded-full">
                    {ad.category}
                  </span>
                )}
                {ad.subcategory && (
                  <span className="px-3 py-1 bg-terra-100 text-terra-700 text-sm rounded-full">
                    {ad.subcategory}
                  </span>
                )}
              </div>

              {/* Descrição */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-terra-900 mb-3">Descrição</h2>
                <p className="text-terra-700 whitespace-pre-wrap">{ad.description}</p>
              </div>

              {/* Método de contacto */}
              <div className="bg-terra-50 p-4 rounded-lg">
                <h3 className="font-semibold text-terra-900 mb-2">Método de contacto preferido:</h3>
                <p className="text-terra-700">
                  {contactMethods[ad.contact_method as keyof typeof contactMethods]}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna direita - Vendedor e CTA */}
        <div className="lg:col-span-1">
          {/* Card do Vendedor */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Vendedor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar e Nome */}
              <div className="flex items-center gap-3">
                <img
                  src={ad.author.avatar_url}
                  alt={ad.author.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-terra-900">{ad.author.username}</h3>
                  <div className="flex items-center gap-1 text-sm text-terra-600">
                    <Star size={14} fill="currentColor" />
                    <span>{ad.author.rating.toFixed(1)}</span>
                    <span>({ad.author.total_reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {ad.author.bio && (
                <p className="text-sm text-terra-700">{ad.author.bio}</p>
              )}

              <hr className="my-4" />

              {/* Botões de ação */}
              <div className="space-y-2">
                <Button
                  onClick={onContactSeller}
                  className="w-full bg-terra-600 hover:bg-terra-700 text-white"
                  size="lg"
                >
                  💬 Enviar Mensagem
                </Button>
                <Button variant="outline" className="w-full" size="lg">
                  <Link href={`/perfil/${ad.author.id}`} className="w-full text-center">
                    Ver Perfil
                  </Link>
                </Button>
              </div>

              {/* Informações de contacto direto */}
              <div className="bg-terra-50 p-4 rounded-lg space-y-2 text-sm">
                <div className="font-semibold text-terra-900">Contacto Direto:</div>
                {ad.contact_method === "phone" && (
                  <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700">
                    📞 Ligar
                  </Button>
                )}
                {ad.contact_method === "email" && (
                  <Button variant="ghost" className="w-full justify-start text-blue-600 hover:text-blue-700">
                    📧 Email
                  </Button>
                )}
                {ad.contact_method === "in_person" && (
                  <div className="text-terra-600">
                    Contacta o vendedor para combinar local
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card de Segurança */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm">🔒 Dicas de Segurança</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-800 space-y-2">
              <p>✓ Encontra-te em local público</p>
              <p>✓ Verifica o produto antes de pagar</p>
              <p>✓ Desconfia de preços muito baixos</p>
              <p>✓ Não compartilhes dados pessoais</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
