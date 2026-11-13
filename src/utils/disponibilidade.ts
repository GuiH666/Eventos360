import { Disponibilidade, Evento } from "../types/Evento";
import { paraData } from "./datas";

/**
 * Decide a situação do evento neste momento.
 * A ordem importa: um evento que já acabou é "encerrado" mesmo que
 * também tenha sido cancelado ou esgotado.
 */
export function disponibilidadeDoEvento(
  evento: Evento,
  agora: Date = new Date()
): Disponibilidade {
  if (paraData(evento.fim).getTime() < agora.getTime()) return "encerrado";
  if (evento.situacao === "cancelado") return "cancelado";
  if (evento.vagasRestantes <= 0) return "esgotado";

  if (evento.inscricoesAte && paraData(evento.inscricoesAte).getTime() < agora.getTime()) {
    return "inscricoes_encerradas";
  }

  return "aberto";
}

/** Só dá para se inscrever (ou demonstrar interesse) em evento aberto. */
export function aceitaInscricao(disp: Disponibilidade): boolean {
  return disp === "aberto";
}

/** Eventos que ainda não terminaram (inclui os que estão acontecendo agora). */
export function ehFuturo(evento: Evento, agora: Date = new Date()): boolean {
  return disponibilidadeDoEvento(evento, agora) !== "encerrado";
}

export const ROTULO_DISPONIBILIDADE: Record<Disponibilidade, string> = {
  aberto: "Inscrições abertas",
  esgotado: "Esgotado",
  inscricoes_encerradas: "Inscrições encerradas",
  cancelado: "Cancelado",
  encerrado: "Encerrado",
};

/** Explicação mostrada na tela de detalhes quando não dá para se inscrever. */
export const EXPLICACAO_DISPONIBILIDADE: Record<Disponibilidade, string> = {
  aberto: "",
  esgotado:
    "Todas as vagas foram preenchidas. Você ainda pode favoritar o evento para acompanhar.",
  inscricoes_encerradas:
    "O prazo de inscrição terminou. Fique de olho: o organizador pode reabrir vagas.",
  cancelado:
    "Este evento foi cancelado pelo organizador. Os lembretes dele foram removidos.",
  encerrado: "Este evento já aconteceu. Veja os próximos na aba Eventos.",
};
