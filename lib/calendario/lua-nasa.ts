// lib/calendario/lua-nasa.ts
// Seleciona, a partir da idade da lua calculada por lua.ts, o frame real da
// NASA (SVS Dial-A-Moon, domínio público) mais próximo dessa idade.
import frames from "./lua-nasa-frames.json";
import { CICLO_SINODICO } from "./lua";

export interface FrameLuaNasa {
  indice: number;
  ficheiro: string;
  idadeReal: number;
  fase: number;
  data: string;
}

const FRAMES = frames as FrameLuaNasa[];

function distanciaCircular(a: number, b: number) {
  const diff = Math.abs(a - b);
  return Math.min(diff, CICLO_SINODICO - diff);
}

export function frameParaIdade(idadeDias: number): FrameLuaNasa {
  let melhor = FRAMES[0];
  let melhorDistancia = Infinity;

  for (const frame of FRAMES) {
    const distancia = distanciaCircular(idadeDias, frame.idadeReal);
    if (distancia < melhorDistancia) {
      melhorDistancia = distancia;
      melhor = frame;
    }
  }

  return melhor;
}

export function caminhoFrameNasa(frame: FrameLuaNasa) {
  return `/lua-nasa/${frame.ficheiro}`;
}
