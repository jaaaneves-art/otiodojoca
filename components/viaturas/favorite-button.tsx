"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/viaturas/favoritos/actions";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  adId: number;
  isFavorite: boolean;
  isLoggedIn: boolean;
  variant?: "card" | "detail";
}

export default function FavoriteButton({ adId, isFavorite, isLoggedIn, variant = "card" }: FavoriteButtonProps) {
  const router = useRouter();
  const [fav, setFav] = useState(isFavorite);
  const [pending, setPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login");
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
        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition ${
          fav
            ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
            : "border-viaturas-200 text-viaturas-700 hover:bg-viaturas-50"
        }`}
        title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
      >
        <Heart size={19} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
        <span>{fav ? "Guardado" : "Guardar"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border shadow-md backdrop-blur transition hover:scale-105 disabled:opacity-60 ${fav ? "border-rose-200 bg-rose-50/95 text-rose-600" : "border-white/70 bg-white/90 text-slate-700 hover:bg-white"}`}
      title={fav ? "Remover dos favoritos" : "Guardar nos favoritos"}
    >
      <Heart size={19} fill={fav ? "currentColor" : "none"} aria-hidden="true" />
    </button>
  );
}
