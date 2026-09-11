"use client";

import { useState } from "react";
import { toggleFavorite } from "@/app/lup/favoritos/actions";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  adId: number;
  isFavorite: boolean;
  isLoggedIn: boolean;
  variant?: "card" | "detail";
}

export default function LupFavoriteButton({ adId, isFavorite, isLoggedIn, variant = "card" }: FavoriteButtonProps) {
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
        className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition ${
          fav
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "border-lup-200 text-lup-700 hover:bg-lup-50"
        }`}
        title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
      >
        <Heart className="h-5 w-5" fill={fav ? "currentColor" : "none"} />
        <span>{fav ? "Guardado" : "Guardar"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
      className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-xl border border-white/70 bg-white/90 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white ${fav ? "text-red-600" : "text-lup-800"}`}
      title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
    >
      <Heart className="h-5 w-5" fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
