// components/calendario/lua-real.tsx
// Lua real (NASA SVS Dial-A-Moon, domínio público) na fase correspondente à
// idade calculada por lua.ts. Se a imagem falhar, recorre à LuaSVG desenhada.
"use client";

import { useState } from "react";
import Image from "next/image";
import LuaSVG from "@/components/calendario/lua-svg";
import { frameParaIdade, caminhoFrameNasa } from "@/lib/calendario/lua-nasa";

interface Props {
  iluminacao: number; // 0..100
  crescente: boolean;
  idadeDias: number; // dias desde a última lua nova (de infoLua().idadeDias)
  tamanho?: number;
}

export default function LuaReal({ iluminacao, crescente, idadeDias, tamanho = 220 }: Props) {
  const [falhou, setFalhou] = useState(false);

  if (falhou) {
    return <LuaSVG iluminacao={iluminacao} crescente={crescente} tamanho={tamanho} />;
  }

  const frame = frameParaIdade(idadeDias);

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{ width: tamanho, height: tamanho }}
    >
      <Image
        src={caminhoFrameNasa(frame)}
        alt={`Lua ${iluminacao}% iluminada`}
        fill
        sizes={`${tamanho}px`}
        className="object-cover"
        onError={() => setFalhou(true)}
      />
    </div>
  );
}
