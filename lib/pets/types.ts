export const PET_KINDS = {
  adoption: { label: "Para adoção", shortLabel: "Adoção", color: "bg-[#fa7b68] text-white" },
  lost: { label: "Animal perdido", shortLabel: "Perdido", color: "bg-[#f4c95d] text-[#102a32]" },
  found: { label: "Animal encontrado", shortLabel: "Encontrado", color: "bg-[#8ed6b4] text-[#102a32]" },
  help: { label: "Pedido de ajuda", shortLabel: "Ajuda", color: "bg-[#9fb7ff] text-[#102a32]" },
} as const;

export const PET_SPECIES = {
  dog: "Cão",
  cat: "Gato",
  bird: "Ave",
  other: "Outro animal",
} as const;

export const PET_SEX = { male: "Macho", female: "Fêmea", unknown: "Desconhecido" } as const;
export const PET_SIZE = { small: "Pequeno", medium: "Médio", large: "Grande" } as const;

export type PetKind = keyof typeof PET_KINDS;
export type PetSpecies = keyof typeof PET_SPECIES;
export type PetPostStatus = "draft" | "published" | "resolved" | "archived";

export type PetPhoto = {
  id: number;
  storage_path: string;
  sort_order: number;
};

export type PetPost = {
  id: string;
  author_id: string;
  kind: PetKind;
  status: PetPostStatus;
  title: string;
  description: string;
  pet_name: string | null;
  species: PetSpecies;
  sex: keyof typeof PET_SEX;
  size: keyof typeof PET_SIZE | null;
  age_label: string | null;
  breed: string | null;
  color: string | null;
  freguesia_id: number;
  location_detail: string | null;
  event_at: string | null;
  is_urgent: boolean;
  published_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  freguesia?: { nome: string; municipio: string } | null;
  author?: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  pet_photos?: PetPhoto[];
};
