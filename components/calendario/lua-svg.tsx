// components/calendario/lua-svg.tsx
// Lua realista em SVG, geometria validada. Sombra conforme iluminação e fase.
"use client";

interface Props {
  iluminacao: number; // 0..100
  crescente: boolean; // true = luz à direita (a crescer)
  tamanho?: number;
}

export default function LuaSVG({ iluminacao, crescente, tamanho = 220 }: Props) {
  const r = 100, cx = 110, cy = 110;
  const f = Math.max(0, Math.min(1, iluminacao / 100));
  const gibosa = f > 0.5;
  const rx = Math.abs(2 * f - 1) * r;
  const uid = `m${Math.round(iluminacao)}${crescente ? "c" : "m"}`;

  const semic = crescente
    ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`
    : `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} Z`;

  let elipse = "";
  let elipseLuz = false;
  if (f > 0.005 && f < 0.995) {
    if (gibosa) {
      elipseLuz = true;
      elipse = crescente
        ? `M ${cx} ${cy - r} A ${rx} ${r} 0 0 0 ${cx} ${cy + r} Z`
        : `M ${cx} ${cy - r} A ${rx} ${r} 0 0 1 ${cx} ${cy + r} Z`;
    } else {
      elipseLuz = false;
      elipse = crescente
        ? `M ${cx} ${cy - r} A ${rx} ${r} 0 0 1 ${cx} ${cy + r} Z`
        : `M ${cx} ${cy - r} A ${rx} ${r} 0 0 0 ${cx} ${cy + r} Z`;
    }
  }

  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 220 220"
      xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label={`Lua ${iluminacao}% iluminada`}>
      <defs>
        <radialGradient id={`${uid}luz`} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#fefdf7" />
          <stop offset="55%" stopColor="#ece7d2" />
          <stop offset="100%" stopColor="#cec7ab" />
        </radialGradient>
        <radialGradient id={`${uid}esc`} cx="55%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#232338" />
          <stop offset="100%" stopColor="#0e0e1a" />
        </radialGradient>
        <radialGradient id={`${uid}halo`} cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="rgba(220,225,255,0)" />
          <stop offset="100%" stopColor="rgba(200,210,255,0.18)" />
        </radialGradient>
        <clipPath id={`${uid}clip`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>

      <circle cx={cx} cy={cy} r={r + 10} fill={`url(#${uid}halo)`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}esc)`} />

      <g clipPath={`url(#${uid}clip)`}>
        {f >= 0.995 ? (
          <circle cx={cx} cy={cy} r={r} fill={`url(#${uid}luz)`} />
        ) : f > 0.005 ? (
          <>
            <path d={semic} fill={`url(#${uid}luz)`} />
            <path d={elipse} fill={elipseLuz ? `url(#${uid}luz)` : `url(#${uid}esc)`} />
          </>
        ) : null}

        {/* Crateras sobre a parte clara */}
        <g clipPath={`url(#${uid}clip)`} opacity="0.28">
          <circle cx="82" cy="72" r="13" fill="#a9a389" />
          <circle cx="138" cy="92" r="8" fill="#a9a389" />
          <circle cx="98" cy="132" r="17" fill="#a9a389" />
          <circle cx="150" cy="148" r="6" fill="#a9a389" />
          <circle cx="118" cy="62" r="5" fill="#a9a389" />
          <circle cx="66" cy="108" r="7" fill="#a9a389" />
        </g>
      </g>

      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
    </svg>
  );
}
