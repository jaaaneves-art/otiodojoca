"use client";

import { useState } from "react";
import { toggleFavorite } from "@/app/gran-bazar/favoritos/actions";

interface FavoriteButtonProps {
  adId: number;
  isFavorite: boolean;
  isLoggedIn: boolean;
  variant?: "card" | "detail";
}

export default function FavoriteButton({ adId, isFavorite, isLoggedIn, variant = "card" }: FavoriteButtonProps) {
  const [fav, setFav] = useState(isFavorite);
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }

    if (pending) return;
    setPending(true);
    setFav(!fav);

    const formData = new FormData();
    formData.append("adId", adId.toString());

    try {
      await toggleFavorite(formData);
    } catch (err) {
      console.error("Erro ao favoritar:", err);
      setFav(fav);
    } finally {
      setPending(false);
    }
  };

  if (variant === "detail") {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className={`flex items-center gap-2 border font-medium py-3 px-4 rounded-lg transition ${
          fav
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "border-bazar-200 text-bazar-700 hover:bg-bazar-50"
        }`}
        title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
      >
        <span className="text-xl">{fav ? "❤️" : "🤍"}</span>
        <span>{fav ? "Guardado" : "Guardar"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="absolute top-2 right-2 z-10 bg-white/90 rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-white transition"
      title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
    >
      <span className="text-lg">{fav ? "❤️" : "🤍"}</span>
    </button>
  );
}
