export type VehicleMakeSuggestion = {
  id: number;
  name: string;
  aliases?: string[];
  score?: number;
};

export type VehicleModelSuggestion = {
  id: number;
  make_id: number;
  name: string;
  aliases?: string[];
  year_start?: number | null;
  year_end?: number | null;
  score?: number;
};

export type VehicleCatalogResponse =
  | { kind: "makes"; items: VehicleMakeSuggestion[] }
  | { kind: "models"; items: VehicleModelSuggestion[] };
