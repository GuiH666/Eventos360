/**
 * Paletas do app. Mesma estrutura nos dois temas: cada tela pede a cor pelo
 * PAPEL que ela tem ("texto", "superfície", "perigo"), nunca pelo valor.
 *
 * Identidade "noite de evento": índigo profundo e violeta elétrico, com coral
 * como segunda cor viva e amarelo-sol nos destaques (preço, últimas vagas).
 * No claro o fundo é um lavanda quase branco; no escuro, um índigo de meia-noite.
 * O texto sobre o violeta é sempre branco.
 */
export type Esquema = "claro" | "escuro";

export type Paleta = {
  esquema: Esquema;

  // Fundos
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceRaised: string;
  input: string;
  border: string;
  borderSoft: string;

  // Texto
  text: string;
  textSecondary: string;
  textMuted: string;

  // Ação principal (botões, aba ativa, filtros marcados)
  primary: string;
  onPrimary: string;
  /** Texto de link e realces sobre o fundo da tela */
  primaryLight: string;
  primaryBackground: string;

  // Segunda cor viva (gráficos, detalhes)
  accent: string;

  // Preços e destaques quentes
  thread: string;
  threadSoft: string;
  threadBackground: string;

  // Estados
  success: string;
  danger: string;
  warning: string;
  successBackground: string;
  dangerBackground: string;
  warningBackground: string;

  // Cartão principal da tela inicial
  heroBg: string;
  heroText: string;
  heroTextSoft: string;
  heroTrack: string;
  heroLine: string;
  /** Cor de realce dentro do cartão principal */
  heroAccent: string;

  white: string;
  overlay: string;
  statusBar: "light" | "dark";
};

export const ESCURO: Paleta = {
  esquema: "escuro",

  background: "#0C0A22",
  surface: "#161337",
  surfaceSecondary: "#201C48",
  surfaceRaised: "#2D2862",
  input: "#110E2E",
  border: "#3B3572",
  borderSoft: "#25204F",

  text: "#F4F2FF",
  textSecondary: "#C9C4F0",
  textMuted: "#948FC9",

  primary: "#7C5CFF",
  onPrimary: "#FFFFFF",
  primaryLight: "#A898FF",
  primaryBackground: "#2A2266",

  accent: "#FF7A66",

  thread: "#FFC93C",
  threadSoft: "rgba(255, 201, 60, 0.4)",
  threadBackground: "#3A2D0B",

  success: "#2DD4A0",
  danger: "#FF6B7A",
  warning: "#FFC93C",
  successBackground: "#0C3330",
  dangerBackground: "#3D1626",
  warningBackground: "#3A2D0B",

  heroBg: "#7C5CFF",
  heroText: "#FFFFFF",
  heroTextSoft: "rgba(255, 255, 255, 0.78)",
  heroTrack: "rgba(255, 255, 255, 0.2)",
  heroLine: "rgba(255, 255, 255, 0.24)",
  heroAccent: "#FFC93C",

  white: "#FFFFFF",
  overlay: "rgba(6, 4, 22, 0.76)",
  statusBar: "light",
};

export const CLARO: Paleta = {
  esquema: "claro",

  background: "#F5F3FF",
  surface: "#FFFFFF",
  surfaceSecondary: "#ECE8FF",
  surfaceRaised: "#DDD7FA",
  input: "#FFFFFF",
  border: "#CFC8F2",
  borderSoft: "#E4E0F8",

  text: "#16123F",
  textSecondary: "#433D75",
  textMuted: "#6A6498",

  primary: "#5A3CF0",
  onPrimary: "#FFFFFF",
  primaryLight: "#4A2FD8",
  primaryBackground: "#E6E0FF",

  accent: "#D93A2B",

  thread: "#8A5A00",
  threadSoft: "rgba(138, 90, 0, 0.4)",
  threadBackground: "#FFF0C7",

  success: "#0B7A55",
  danger: "#C62847",
  warning: "#8A5A00",
  successBackground: "#D3F3E6",
  dangerBackground: "#FFDCE2",
  warningBackground: "#FFF0C7",

  heroBg: "#5A3CF0",
  heroText: "#FFFFFF",
  heroTextSoft: "rgba(255, 255, 255, 0.8)",
  heroTrack: "rgba(255, 255, 255, 0.22)",
  heroLine: "rgba(255, 255, 255, 0.26)",
  heroAccent: "#FFD54A",

  white: "#FFFFFF",
  overlay: "rgba(22, 18, 63, 0.5)",
  statusBar: "dark",
};

export const PALETAS: Record<Esquema, Paleta> = {
  escuro: ESCURO,
  claro: CLARO,
};
