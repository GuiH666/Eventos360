import { describe, expect, it } from "vitest";
import {
  dataHoraCurta,
  dataPorExtenso,
  diasEntre,
  periodo,
  rotuloRelativo,
  saudacao,
} from "../datas";

// Todas as datas são locais (new Date(ano, mês-1, dia, ...)) para não depender do fuso.
const d = (dia: number, hora = 12, min = 0) => new Date(2026, 10, dia, hora, min);

describe("diasEntre e rotuloRelativo", () => {
  it("conta dias de calendário ignorando a hora", () => {
    expect(diasEntre(d(19, 23, 59), d(20, 0, 1))).toBe(1);
  });

  it("monta o rótulo relativo", () => {
    const agora = d(19);
    expect(rotuloRelativo(d(19, 20), agora)).toBe("Hoje");
    expect(rotuloRelativo(d(20), agora)).toBe("Amanhã");
    expect(rotuloRelativo(d(18), agora)).toBe("Ontem");
    expect(rotuloRelativo(d(24), agora)).toBe("Em 5 dias");
    expect(rotuloRelativo(d(16), agora)).toBe("Há 3 dias");
  });
});

describe("formatação em português", () => {
  it("formata data curta e por extenso", () => {
    expect(dataHoraCurta(d(19, 14))).toBe("qui, 19 nov · 14:00");
    expect(dataPorExtenso(d(19))).toBe("quinta-feira, 19 de novembro de 2026");
  });

  it("período no mesmo dia e em vários dias", () => {
    expect(periodo(d(19, 14).toISOString(), d(19, 18).toISOString())).toBe(
      "qui, 19 nov · 14:00 – 18:00"
    );
    expect(periodo(d(28, 9).toISOString(), d(29, 18).toISOString())).toBe(
      "28 nov, 09:00 → 29 nov, 18:00"
    );
  });
});

describe("saudacao", () => {
  it("muda conforme a hora", () => {
    expect(saudacao(d(19, 3))).toBe("Boa madrugada");
    expect(saudacao(d(19, 9))).toBe("Bom dia");
    expect(saudacao(d(19, 15))).toBe("Boa tarde");
    expect(saudacao(d(19, 20))).toBe("Boa noite");
  });
});
