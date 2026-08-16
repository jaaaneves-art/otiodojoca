// lib/calendario/astro.ts
// Nascer e pôr do sol e da lua para uma data e localização.
// Fórmulas de baixa precisão de domínio público (posição solar da USNO,
// posição lunar truncada da teoria ELP) — precisão tipica de poucos
// minutos, suficiente para uso num calendário de jardinagem. Sem internet,
// sem base de dados: tudo calculado no cliente.

export interface HorarioAstro {
  nascer: string | null; // "HH:mm" hora local, ou null se o astro não nasce nesse dia
  poente: string | null;
}

export interface EventosAstro {
  sol: HorarioAstro;
  lua: HorarioAstro;
}

const GRAUS = Math.PI / 180;
const RAD = 180 / Math.PI;

// Ângulo abaixo do horizonte geométrico considerado "nascer/pôr":
// sol -0.833° (refração atmosférica + raio aparente do disco);
// lua +0.125° (paralaxe da lua domina sobre refração + raio aparente).
const LIMIAR_SOL = -0.833;
const LIMIAR_LUA = 0.125;

function diaJuliano(data: Date): number {
  return data.getTime() / 86400000 + 2440587.5;
}

function posicaoSol(jd: number) {
  const d = jd - 2451545.0;
  const g = (357.529 + 0.98560028 * d) * GRAUS;
  const q = 280.459 + 0.98564736 * d;
  const l = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * GRAUS;
  const e = (23.439 - 0.00000036 * d) * GRAUS;
  const ascensaoReta = Math.atan2(Math.cos(e) * Math.sin(l), Math.cos(l));
  const declinacao = Math.asin(Math.sin(e) * Math.sin(l));
  return { ascensaoReta, declinacao };
}

function posicaoLua(jd: number) {
  const d = jd - 2451545.0;
  const longitudeMedia = (218.316 + 13.176396 * d) * GRAUS;
  const anomaliaMedia = (134.963 + 13.064993 * d) * GRAUS;
  const argumentoLatitude = (93.272 + 13.22935 * d) * GRAUS;
  const longitude = longitudeMedia + 6.289 * GRAUS * Math.sin(anomaliaMedia);
  const latitude = 5.128 * GRAUS * Math.sin(argumentoLatitude);
  const e = (23.439 - 0.00000036 * d) * GRAUS;
  const ascensaoReta = Math.atan2(
    Math.sin(longitude) * Math.cos(e) - Math.tan(latitude) * Math.sin(e),
    Math.cos(longitude),
  );
  const declinacao = Math.asin(
    Math.sin(latitude) * Math.cos(e) + Math.cos(latitude) * Math.sin(e) * Math.sin(longitude),
  );
  return { ascensaoReta, declinacao };
}

function tempoSideralGreenwich(jd: number): number {
  const d = jd - 2451545.0;
  let gmst = (280.46061837 + 360.98564736629 * d) % 360;
  if (gmst < 0) gmst += 360;
  return gmst * GRAUS;
}

function altitudeGraus(
  posicao: { ascensaoReta: number; declinacao: number },
  jd: number,
  latRad: number,
  lonRad: number,
): number {
  const anguloHorario = tempoSideralGreenwich(jd) + lonRad - posicao.ascensaoReta;
  const { declinacao } = posicao;
  return (
    Math.asin(
      Math.sin(latRad) * Math.sin(declinacao) +
        Math.cos(latRad) * Math.cos(declinacao) * Math.cos(anguloHorario),
    ) * RAD
  );
}

const AMOSTRAS_POR_DIA = 288; // uma amostra a cada 5 minutos

function calcularHorario(
  data: Date,
  latitude: number,
  longitude: number,
  posicaoFn: (jd: number) => { ascensaoReta: number; declinacao: number },
  limiarGraus: number,
): HorarioAstro {
  const latRad = latitude * GRAUS;
  const lonRad = longitude * GRAUS;
  const inicioDia = new Date(
    Date.UTC(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0),
  );
  const intervaloMs = 86400000 / AMOSTRAS_POR_DIA;

  let nascer: string | null = null;
  let poente: string | null = null;
  let altitudeAnterior: number | null = null;

  for (let i = 0; i <= AMOSTRAS_POR_DIA; i++) {
    const instante = new Date(inicioDia.getTime() + i * intervaloMs);
    const altitude = altitudeGraus(posicaoFn(diaJuliano(instante)), diaJuliano(instante), latRad, lonRad);

    if (altitudeAnterior !== null) {
      if (nascer === null && altitudeAnterior < limiarGraus && altitude >= limiarGraus) {
        const fracao = (limiarGraus - altitudeAnterior) / (altitude - altitudeAnterior);
        nascer = formatarHoraLocal(new Date(inicioDia.getTime() + (i - 1 + fracao) * intervaloMs));
      }
      if (poente === null && altitudeAnterior >= limiarGraus && altitude < limiarGraus) {
        const fracao = (altitudeAnterior - limiarGraus) / (altitudeAnterior - altitude);
        poente = formatarHoraLocal(new Date(inicioDia.getTime() + (i - 1 + fracao) * intervaloMs));
      }
    }
    altitudeAnterior = altitude;
  }

  return { nascer, poente };
}

function formatarHoraLocal(instante: Date): string {
  return instante.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function eventosAstro(data: Date, latitude: number, longitude: number): EventosAstro {
  return {
    sol: calcularHorario(data, latitude, longitude, posicaoSol, LIMIAR_SOL),
    lua: calcularHorario(data, latitude, longitude, posicaoLua, LIMIAR_LUA),
  };
}

// O sol está acima do horizonte (mesmo limiar usado no nascer/pôr) neste instante?
export function ehDeDia(data: Date, latitude: number, longitude: number): boolean {
  const jd = diaJuliano(data);
  const altitude = altitudeGraus(posicaoSol(jd), jd, latitude * GRAUS, longitude * GRAUS);
  return altitude >= LIMIAR_SOL;
}
