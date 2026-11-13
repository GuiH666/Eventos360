import { Ionicons } from "@expo/vector-icons";

import { Categoria, Modalidade } from "../types/Evento";
import { COLORS } from "../theme/colors";

type Visual = {
  fundo: string;
  texto: string;
  icone: keyof typeof Ionicons.glyphMap;
};

/*
 * Cada categoria tem uma cor própria. As cores mudam entre o tema claro e o
 * escuro para manter o contraste do texto em cima delas.
 */
const CORES_ESCURO: Record<Categoria, string> = {
  Palestra: "#C8FF2E",
  Oficina: "#9B86FF",
  Hackathon: "#FFB020",
  "Semana acadêmica": "#35E0A1",
  Profissional: "#FF7AC8",
};

const CORES_CLARO: Record<Categoria, string> = {
  Palestra: "#111114",
  Oficina: "#5B3DF5",
  Hackathon: "#975000",
  "Semana acadêmica": "#07774F",
  Profissional: "#B3126B",
};

const ICONES: Record<Categoria, keyof typeof Ionicons.glyphMap> = {
  Palestra: "mic-outline",
  Oficina: "construct-outline",
  Hackathon: "flash-outline",
  "Semana acadêmica": "school-outline",
  Profissional: "briefcase-outline",
};

/** Cores e ícone da categoria, já no tema que está valendo. */
export function visualDaCategoria(categoria: Categoria): Visual {
  const escuro = COLORS.esquema === "escuro";
  const fundo = (escuro ? CORES_ESCURO : CORES_CLARO)[categoria];

  return {
    fundo,
    // Palestra no tema claro é preta: o texto vira limão, como o botão do app.
    texto: escuro ? "#0B0B0E" : categoria === "Palestra" ? "#C8FF2E" : "#FFFFFF",
    icone: ICONES[categoria],
  };
}

export const ICONE_MODALIDADE: Record<Modalidade, keyof typeof Ionicons.glyphMap> = {
  Presencial: "location-outline",
  Online: "videocam-outline",
  Híbrido: "layers-outline",
};
