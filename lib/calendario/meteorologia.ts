export interface CondicoesAtuais {
  temperatura: number;
  sensacaoTermica: number;
  precipitacao: number;
  codigoTempo: number;
  vento: number;
}

export interface PrevisaoDiaria {
  data: string;
  codigoTempo: number;
  temperaturaMaxima: number;
  temperaturaMinima: number;
  probabilidadePrecipitacao: number;
  precipitacao: number;
  ventoMaximo: number;
}

export interface PrevisaoMeteorologica {
  atual: CondicoesAtuais;
  diaria: PrevisaoDiaria[];
}

export interface AvisoHorta {
  icone: string;
  texto: string;
}

interface RespostaOpenMeteo {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}

export async function obterPrevisaoMeteorologica(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<PrevisaoMeteorologica> {
  const parametros = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max",
    forecast_days: "14",
    timezone: "auto",
  });

  const resposta = await fetch(
    `https://api.open-meteo.com/v1/forecast?${parametros.toString()}`,
    { signal },
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível obter a previsão meteorológica.");
  }

  const dados = (await resposta.json()) as RespostaOpenMeteo;
  if (!dados.current || !dados.daily) {
    throw new Error("A previsão meteorológica recebida está incompleta.");
  }

  return {
    atual: {
      temperatura: dados.current.temperature_2m,
      sensacaoTermica: dados.current.apparent_temperature,
      precipitacao: dados.current.precipitation,
      codigoTempo: dados.current.weather_code,
      vento: dados.current.wind_speed_10m,
    },
    diaria: dados.daily.time.map((data, indice) => ({
      data,
      codigoTempo: dados.daily!.weather_code[indice],
      temperaturaMaxima: dados.daily!.temperature_2m_max[indice],
      temperaturaMinima: dados.daily!.temperature_2m_min[indice],
      probabilidadePrecipitacao:
        dados.daily!.precipitation_probability_max[indice],
      precipitacao: dados.daily!.precipitation_sum[indice],
      ventoMaximo: dados.daily!.wind_speed_10m_max[indice],
    })),
  };
}

export function descricaoTempo(codigo: number) {
  if (codigo === 0) return { texto: "Céu limpo", icone: "☀️" };
  if ([1, 2].includes(codigo)) return { texto: "Pouco nublado", icone: "🌤️" };
  if (codigo === 3) return { texto: "Nublado", icone: "☁️" };
  if ([45, 48].includes(codigo)) return { texto: "Nevoeiro", icone: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(codigo)) return { texto: "Chuvisco", icone: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(codigo)) return { texto: "Chuva", icone: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(codigo)) return { texto: "Neve", icone: "🌨️" };
  if ([95, 96, 99].includes(codigo)) return { texto: "Trovoada", icone: "⛈️" };
  return { texto: "Condições variáveis", icone: "🌡️" };
}

export function avisosParaHorta(dia: PrevisaoDiaria): AvisoHorta[] {
  const avisos: AvisoHorta[] = [];

  if (dia.temperaturaMinima <= 2) {
    avisos.push({
      icone: "❄️",
      texto: "Risco de frio: protege as plantas mais sensíveis durante a noite.",
    });
  }

  if (dia.temperaturaMaxima >= 32) {
    avisos.push({
      icone: "☀️",
      texto: "Dia muito quente: rega cedo ou ao fim do dia e vigia as plantas jovens.",
    });
  }

  if (dia.probabilidadePrecipitacao >= 70 || dia.precipitacao >= 5) {
    avisos.push({
      icone: "🌧️",
      texto: "Há chuva prevista: verifica a drenagem antes de regar.",
    });
  }

  if (dia.ventoMaximo >= 40) {
    avisos.push({
      icone: "💨",
      texto: "Vento forte previsto: adia pulverizações e apoia as plantas altas.",
    });
  }

  return avisos;
}
