/** Categorias de evento aceitas pelo app (mesmas da API). */
export const CATEGORIAS = [
  "Palestra",
  "Oficina",
  "Hackathon",
  "Semana acadêmica",
  "Profissional",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const MODALIDADES = ["Presencial", "Online", "Híbrido"] as const;
export type Modalidade = (typeof MODALIDADES)[number];

/** Situação informada pela API. */
export type SituacaoApi = "confirmado" | "cancelado";

/** Um evento, já validado e normalizado a partir do JSON da API. */
export type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  modalidade: Modalidade;
  /** Datas em ISO 8601 com fuso, ex.: 2026-11-19T14:00:00-03:00 */
  inicio: string;
  fim: string;
  local: string;
  organizador: string;
  vagas: number;
  vagasRestantes: number;
  gratuito: boolean;
  preco: number;
  situacao: SituacaoApi;
  /** Prazo final para se inscrever (opcional) */
  inscricoesAte?: string;
  link?: string;
  tags: string[];
};

/**
 * Situação do evento NESTE momento. Combina o que a API informa
 * (cancelado, vagas) com a data atual (encerrado, prazo de inscrição).
 */
export type Disponibilidade =
  | "aberto"
  | "esgotado"
  | "inscricoes_encerradas"
  | "cancelado"
  | "encerrado";

/** Evento marcado como favorito (guarda uma cópia para funcionar sem internet). */
export type Favorito = {
  eventoId: string;
  dados: Evento;
  /** Id do lembrete agendado no sistema (null = sem lembrete) */
  notificacaoId: string | null;
  criadoEm: string;
};

export type TipoInscricao = "inscricao" | "interesse";

/** Dados digitados no formulário. */
export type NovaInscricao = {
  eventoId: string;
  eventoTitulo: string;
  eventoInicio: string;
  tipo: TipoInscricao;
  nome: string;
  email: string;
  telefone: string;
  curso: string;
  observacao: string;
};

export type Inscricao = NovaInscricao & {
  id: number;
  criadoEm: string;
};
