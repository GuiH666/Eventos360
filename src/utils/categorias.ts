import { Ionicons } from "@expo/vector-icons";

import { Categoria, Modalidade } from "../types/Evento";
import { COLORS } from "../theme/colors";

type Visual = {
  fundo: string;
  texto: string;
  icone: keyof typeof Ionicons.glyphMap;
};

/*
 * Cada categoria tem uma cor própria: violeta (palestra), coral (oficina),
 * amarelo (hackathon), turquesa (semana acadêmica) e azul (profissional).
 * Mudam entre o tema claro e o escuro para manter o contraste do texto.
 */
const CORES_ESCURO: Record<Categoria, string> = {
  Palestra: "#A898FF",
  Oficina: "#FF7A66",
  Hackathon: "#FFC93C",
  "Semana acadêmica": "#2DD4C4",
  Profissional: "#62B6FF",
};

const CORES_CLARO: Record<Categoria, string> = {
  Palestra: "#5A3CF0",
  Oficina: "#D93A2B",
  Hackathon: "#8A5A00",
  "Semana acadêmica": "#0A7C86",
  Profissional: "#1B5FB8",
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
    // Cores vivas no escuro levam texto escuro; cores fortes no claro levam texto branco.
    texto: escuro ? "#0C0A22" : "#FFFFFF",
    icone: ICONES[categoria],
  };
}

export const ICONE_MODALIDADE: Record<Modalidade, keyof typeof Ionicons.glyphMap> = {
  Presencial: "location-outline",
  Online: "videocam-outline",
  Híbrido: "layers-outline",
};
