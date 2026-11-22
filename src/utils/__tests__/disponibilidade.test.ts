import { describe, expect, it } from "vitest";
import type { Evento } from "../../types/Evento";
import { aceitaInscricao, disponibilidadeDoEvento, ehFuturo } from "../disponibilidade";

const AGORA = new Date("2026-11-19T12:00:00Z");

function evento(sobrescrever: Partial<Evento> = {}): Evento {
  return {
    id: "1",
    titulo: "Palestra de IA",
    descricao: "Introdução",
    categoria: "Palestra",
    modalidade: "Presencial",
    inicio: "2026-11-25T18:00:00Z",
    fim: "2026-11-25T20:00:00Z",
    local: "Auditório",
    organizador: "Centro Acadêmico",
    vagas: 50,
    vagasRestantes: 10,
    gratuito: true,
    preco: 0,
    situacao: "confirmado",
    tags: [],
    ...sobrescrever,
  };
}

describe("disponibilidadeDoEvento", () => {
  it("evento futuro com vagas está aberto", () => {
    expect(disponibilidadeDoEvento(evento(), AGORA)).toBe("aberto");
  });

  it("evento que já terminou é encerrado, mesmo se cancelado ou esgotado", () => {
    const passado = { inicio: "2026-11-10T10:00:00Z", fim: "2026-11-10T12:00:00Z" };
    expect(disponibilidadeDoEvento(evento(passado), AGORA)).toBe("encerrado");
    expect(
      disponibilidadeDoEvento(evento({ ...passado, situacao: "cancelado" }), AGORA)
    ).toBe("encerrado");
    expect(
      disponibilidadeDoEvento(evento({ ...passado, vagasRestantes: 0 }), AGORA)
    ).toBe("encerrado");
  });

  it("cancelado vale mais que esgotado", () => {
    expect(
      disponibilidadeDoEvento(evento({ situacao: "cancelado", vagasRestantes: 0 }), AGORA)
    ).toBe("cancelado");
  });

  it("sem vagas é esgotado", () => {
    expect(disponibilidadeDoEvento(evento({ vagasRestantes: 0 }), AGORA)).toBe("esgotado");
  });

  it("prazo de inscrição vencido fecha as inscrições", () => {
    expect(
      disponibilidadeDoEvento(evento({ inscricoesAte: "2026-11-18T23:59:00Z" }), AGORA)
    ).toBe("inscricoes_encerradas");
    expect(
      disponibilidadeDoEvento(evento({ inscricoesAte: "2026-11-24T23:59:00Z" }), AGORA)
    ).toBe("aberto");
  });

  it("evento acontecendo agora ainda não terminou", () => {
    const emAndamento = evento({
      inicio: "2026-11-19T10:00:00Z",
      fim: "2026-11-19T14:00:00Z",
    });
    expect(ehFuturo(emAndamento, AGORA)).toBe(true);
  });
});

describe("aceitaInscricao", () => {
  it("só aceita quando o evento está aberto", () => {
    expect(aceitaInscricao("aberto")).toBe(true);
    for (const d of ["esgotado", "inscricoes_encerradas", "cancelado", "encerrado"] as const) {
      expect(aceitaInscricao(d)).toBe(false);
    }
  });
});
