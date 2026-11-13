import { Categoria, Evento, Modalidade } from "../types/Evento";
import { Janela, inicioDoDia, limitesDaJanela, paraData } from "./datas";
import { ehFuturo } from "./disponibilidade";

export type Filtros = {
  busca: string;
  categoria: Categoria | null;
  modalidade: Modalidade | null;
  janela: Janela;
  mostrarEncerrados: boolean;
};

export const FILTROS_INICIAIS: Filtros = {
  busca: "",
  categoria: null,
  modalidade: null,
  janela: "qualquer",
  mostrarEncerrados: false,
};

export function temFiltroAtivo(f: Filtros): boolean {
  return (
    f.busca.trim() !== "" ||
    f.categoria !== null ||
    f.modalidade !== null ||
    f.janela !== "qualquer" ||
    f.mostrarEncerrados
  );
}

/** Tira acentos e maiúsculas: "Híbrido" casa com "hibrido". */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Reconhece "20/11" ou "20/11/2026" digitados na busca. */
function lerDiaDigitado(busca: string): { dia: number; mes: number } | null {
  const m = busca.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/);
  if (!m) return null;
  return { dia: Number(m[1]), mes: Number(m[2]) };
}

function casaComBusca(evento: Evento, busca: string): boolean {
  const termo = busca.trim();
  if (!termo) return true;

  const diaDigitado = lerDiaDigitado(termo);
  if (diaDigitado) {
    const d = paraData(evento.inicio);
    return d.getDate() === diaDigitado.dia && d.getMonth() + 1 === diaDigitado.mes;
  }

  const alvo = normalizar(
    [
      evento.titulo,
      evento.descricao,
      evento.categoria,
      evento.modalidade,
      evento.local,
      evento.organizador,
      evento.tags.join(" "),
    ].join(" ")
  );

  // Todas as palavras digitadas precisam aparecer (em qualquer ordem).
  return normalizar(termo)
    .split(/\s+/)
    .every((palavra) => alvo.includes(palavra));
}

/**
 * Aplica busca e filtros e ordena:
 *   1. eventos que ainda vão acontecer, do mais próximo para o mais distante;
 *   2. (opcional) encerrados, do mais recente para o mais antigo.
 */
export function filtrarEventos(
  eventos: Evento[],
  filtros: Filtros,
  agora: Date = new Date()
): Evento[] {
  const limites = limitesDaJanela(filtros.janela, agora);

  const resultado = eventos.filter((e) => {
    const futuro = ehFuturo(e, agora);
    if (!futuro && !filtros.mostrarEncerrados) return false;

    if (filtros.categoria && e.categoria !== filtros.categoria) return false;
    if (filtros.modalidade && e.modalidade !== filtros.modalidade) return false;

    if (limites) {
      const inicio = inicioDoDia(paraData(e.inicio)).getTime();
      const fim = paraData(e.fim).getTime();
      // o evento entra se qualquer parte dele cai dentro da janela
      if (fim < limites[0].getTime() || inicio >= limites[1].getTime()) return false;
    }

    return casaComBusca(e, filtros.busca);
  });

  const futuros = resultado
    .filter((e) => ehFuturo(e, agora))
    .sort((a, b) => paraData(a.inicio).getTime() - paraData(b.inicio).getTime());

  const passados = resultado
    .filter((e) => !ehFuturo(e, agora))
    .sort((a, b) => paraData(b.inicio).getTime() - paraData(a.inicio).getTime());

  return [...futuros, ...passados];
}
