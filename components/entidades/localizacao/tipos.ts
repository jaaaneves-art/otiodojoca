export interface Localizacao {
  id: number;
  codigo_postal: string;
  cod_ine?: string;
  nome: string;
  localidade: string;
  municipio?: string;
  distrito?: string;
  latitude?: number;
  longitude?: number;
}
