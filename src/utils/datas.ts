/*
 * Datas em português, sem depender de Intl (que varia entre aparelhos).
 * Todas as funções recebem texto ISO 8601 ou Date.
 */

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const DIAS_LONGOS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];
const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];
const MESES_LONGOS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const MS_DIA = 24 * 60 * 60 * 1000;

export function paraData(valor: string | Date): Date {
  return valor instanceof Date ? valor : new Date(valor);
}

function dois(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Diferença em dias de calendário (b - a), ignorando a hora. */
export function diasEntre(a: Date, b: Date): number {
  return Math.round((inicioDoDia(b).getTime() - inicioDoDia(a).getTime()) / MS_DIA);
}

export function hora(valor: string | Date): string {
  const d = paraData(valor);
  return `${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** "19 nov" */
export function diaMesCurto(valor: string | Date): string {
  const d = paraData(valor);
  return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
}

/** { dia: "19", mes: "NOV" } para o selo de data dos cartões */
export function seloDeData(valor: string | Date) {
  const d = paraData(valor);
  return { dia: dois(d.getDate()), mes: MESES_CURTOS[d.getMonth()].toUpperCase() };
}

/** "qui, 19 nov · 14:00" */
export function dataHoraCurta(valor: string | Date): string {
  const d = paraData(valor);
  return `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]} · ${hora(d)}`;
}

/** "quinta-feira, 19 de novembro de 2026" */
export function dataPorExtenso(valor: string | Date): string {
  const d = paraData(valor);
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Período do evento:
 *   mesmo dia  -> "qui, 19 nov · 14:00 – 18:00"
 *   vários dias -> "28 nov, 09:00 → 29 nov, 18:00"
 */
export function periodo(inicio: string, fim: string): string {
  const a = paraData(inicio);
  const b = paraData(fim);

  if (mesmoDia(a, b)) {
    return `${dataHoraCurta(a)} – ${hora(b)}`;
  }

  return `${diaMesCurto(a)}, ${hora(a)} → ${diaMesCurto(b)}, ${hora(b)}`;
}

/** "Hoje", "Amanhã", "Em 5 dias", "Ontem", "Há 3 dias" */
export function rotuloRelativo(valor: string | Date, agora = new Date()): string {
  const dias = diasEntre(agora, paraData(valor));

  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  if (dias === -1) return "Ontem";
  if (dias > 1) return `Em ${dias} dias`;
  return `Há ${Math.abs(dias)} dias`;
}

/** "12/11 às 17:39" para mostrar quando algo foi salvo */
export function dataHoraCompacta(valor: string | Date): string {
  const d = paraData(valor);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)} às ${hora(d)}`;
}

export function saudacao(agora = new Date()): string {
  const h = agora.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function saudacaoComData(agora = new Date()): string {
  return `${DIAS_LONGOS[agora.getDay()]}, ${agora.getDate()} de ${MESES_LONGOS[agora.getMonth()]}`;
}

/** Intervalo [início, fim) de cada janela de data usada no filtro. */
export type Janela = "qualquer" | "7dias" | "mes" | "proximoMes";

export const ROTULO_JANELA: Record<Janela, string> = {
  qualquer: "Qualquer data",
  "7dias": "Próximos 7 dias",
  mes: "Este mês",
  proximoMes: "Mês que vem",
};

export function limitesDaJanela(janela: Janela, agora: Date): [Date, Date] | null {
  const hoje = inicioDoDia(agora);

  switch (janela) {
    case "7dias":
      return [hoje, new Date(hoje.getTime() + 7 * MS_DIA)];
    case "mes":
      return [hoje, new Date(agora.getFullYear(), agora.getMonth() + 1, 1)];
    case "proximoMes":
      return [
        new Date(agora.getFullYear(), agora.getMonth() + 1, 1),
        new Date(agora.getFullYear(), agora.getMonth() + 2, 1),
      ];
    default:
      return null;
  }
}
