import { describe, expect, it } from "vitest";
import type { Evento } from "../../types/Evento";
import { FILTROS_INICIAIS, filtrarEventos, normalizar, temFiltroAtivo } from "../filtros";

// Datas montadas em horário local para o teste não depender do fuso da máquina.
const AGORA = new Date(2026, 10, 19, 9, 0); // 19/11/2026 09:00
const iso = (m: number, d: number, h = 10) => new Date(2026, m - 1, d, h).toISOString();

function evento(id: string, sobrescrever: Partial<Evento> = {}): Evento {
  return {
    id,
    titulo: `Evento ${id}`,
    descricao: "Descrição",
    categoria: "Palestra",
    modalidade: "Presencial",
    inicio: iso(11, 25),
    fim: iso(11, 25, 12),
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

const ids = (lista: Evento[]) => lista.map((e) => e.id);

describe("normalizar", () => {
  it("tira acentos, maiúsculas e espaços das pontas", () => {
    expect(normalizar("  Híbrido ")).toBe("hibrido");
  });
});

describe("temFiltroAtivo", () => {
  it("é falso nos filtros iniciais e verdadeiro com qualquer filtro", () => {
    expect(temFiltroAtivo(FILTROS_INICIAIS)).toBe(false);
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, busca: "ia" })).toBe(true);
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, categoria: "Oficina" })).toBe(true);
    expect(temFiltroAtivo({ ...FILTROS_INICIAIS, mostrarEncerrados: true })).toBe(true);
  });
});

describe("filtrarEventos", () => {
  const eventos = [
    evento("longe", { inicio: iso(12, 10), fim: iso(12, 10, 12) }),
    evento("perto", { inicio: iso(11, 20), fim: iso(11, 20, 12) }),
    evento("antigo", { inicio: iso(11, 1), fim: iso(11, 1, 12) }),
    evento("oficina", {
      categoria: "Oficina",
      modalidade: "Híbrido",
      titulo: "Oficina de Git",
      inicio: iso(11, 22),
      fim: iso(11, 22, 12),
    }),
  ];

  it("esconde encerrados e ordena do mais próximo para o mais distante", () => {
    expect(ids(filtrarEventos(eventos, FILTROS_INICIAIS, AGORA))).toEqual([
      "perto",
      "oficina",
      "longe",
    ]);
  });

  it("mostra encerrados no fim da lista quando pedido", () => {
    const lista = filtrarEventos(eventos, { ...FILTROS_INICIAIS, mostrarEncerrados: true }, AGORA);
    expect(ids(lista)).toEqual(["perto", "oficina", "longe", "antigo"]);
  });

  it("filtra por categoria e por modalidade", () => {
    expect(
      ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, categoria: "Oficina" }, AGORA))
    ).toEqual(["oficina"]);
    expect(
      ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, modalidade: "Híbrido" }, AGORA))
    ).toEqual(["oficina"]);
  });

  it("busca ignora acento e exige todas as palavras", () => {
    expect(ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, busca: "hibrido" }, AGORA))).toEqual([
      "oficina",
    ]);
    expect(ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, busca: "oficina git" }, AGORA))).toEqual([
      "oficina",
    ]);
    expect(filtrarEventos(eventos, { ...FILTROS_INICIAIS, busca: "oficina python" }, AGORA)).toEqual([]);
  });

  it("busca por data digitada (20/11)", () => {
    expect(ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, busca: "20/11" }, AGORA))).toEqual([
      "perto",
    ]);
  });

  it("janela de 7 dias deixa só o que acontece na próxima semana", () => {
    expect(ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, janela: "7dias" }, AGORA))).toEqual([
      "perto",
      "oficina",
    ]);
  });

  it("janela 'mês que vem' pega só dezembro", () => {
    expect(ids(filtrarEventos(eventos, { ...FILTROS_INICIAIS, janela: "proximoMes" }, AGORA))).toEqual([
      "longe",
    ]);
  });
});
