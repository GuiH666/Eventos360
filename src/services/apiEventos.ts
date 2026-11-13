import { API_EVENTOS, TIMEOUT_API_MS } from "../config";
import {
  CATEGORIAS,
  Categoria,
  Evento,
  MODALIDADES,
  Modalidade,
} from "../types/Evento";

/*
 * Cliente da API REST de eventos.
 *
 *   GET {API_EVENTOS}   ->   { "versao": 1, "eventos": [ { ...evento }, ... ] }
 *
 * Os erros são classificados para a tela poder explicar o que houve:
 *   "rede"    - sem conexão ou servidor inacessível
 *   "timeout" - a API demorou mais que TIMEOUT_API_MS
 *   "http"    - a API respondeu com erro (404, 500...)
 *   "formato" - respondeu, mas o JSON não é o esperado
 */
export type TipoErroApi = "rede" | "timeout" | "http" | "formato";

export class ErroApi extends Error {
  tipo: TipoErroApi;
  status?: number;

  constructor(tipo: TipoErroApi, mensagem: string, status?: number) {
    super(mensagem);
    this.name = "ErroApi";
    this.tipo = tipo;
    this.status = status;
  }
}

/** Texto amigável para cada tipo de falha. */
export function mensagemDoErro(erro: unknown): string {
  if (erro instanceof ErroApi) {
    switch (erro.tipo) {
      case "rede":
        return "Sem conexão com a internet ou servidor indisponível.";
      case "timeout":
        return "O servidor demorou demais para responder.";
      case "http":
        return `O servidor respondeu com erro (${erro.status ?? "?"}).`;
      case "formato":
        return "O servidor enviou dados em um formato inesperado.";
    }
  }
  return "Não foi possível carregar os eventos.";
}

export type RespostaApi = {
  eventos: Evento[];
  /** Quantos itens vieram inválidos e foram descartados */
  descartados: number;
};

export async function buscarEventosApi(): Promise<RespostaApi> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), TIMEOUT_API_MS);

  let resposta: Response;
  try {
    resposta = await fetch(API_EVENTOS, {
      headers: { Accept: "application/json" },
      signal: controle.signal,
    });
  } catch {
    throw controle.signal.aborted
      ? new ErroApi("timeout", "Tempo esgotado")
      : new ErroApi("rede", "Falha de rede");
  } finally {
    clearTimeout(timer);
  }

  if (!resposta.ok) {
    throw new ErroApi("http", `HTTP ${resposta.status}`, resposta.status);
  }

  let json: unknown;
  try {
    json = await resposta.json();
  } catch {
    throw new ErroApi("formato", "JSON inválido");
  }

  // aceita tanto { eventos: [...] } quanto uma lista direta
  const lista = Array.isArray(json) ? json : (json as any)?.eventos;
  if (!Array.isArray(lista)) {
    throw new ErroApi("formato", "A resposta não contém uma lista de eventos");
  }

  const eventos: Evento[] = [];
  for (const bruto of lista) {
    const evento = normalizarEvento(bruto);
    if (evento) eventos.push(evento);
  }

  return { eventos, descartados: lista.length - eventos.length };
}

function texto(valor: unknown, padrao = ""): string {
  return typeof valor === "string" ? valor : padrao;
}

function numero(valor: unknown, padrao = 0): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : padrao;
}

function dataValida(valor: unknown): valor is string {
  return typeof valor === "string" && !Number.isNaN(new Date(valor).getTime());
}

/**
 * Valida um item do JSON. Devolve null quando faltam campos essenciais
 * (id, título ou datas), assim um registro ruim não derruba a lista inteira.
 */
export function normalizarEvento(bruto: any): Evento | null {
  if (!bruto || typeof bruto !== "object") return null;
  if (!texto(bruto.id) || !texto(bruto.titulo)) return null;
  if (!dataValida(bruto.inicio)) return null;

  const inicio: string = bruto.inicio;
  const fim: string = dataValida(bruto.fim) ? bruto.fim : inicio;

  const categoria: Categoria = (CATEGORIAS as readonly string[]).includes(bruto.categoria)
    ? bruto.categoria
    : "Palestra";
  const modalidade: Modalidade = (MODALIDADES as readonly string[]).includes(bruto.modalidade)
    ? bruto.modalidade
    : "Presencial";

  const vagas = Math.max(0, numero(bruto.vagas));

  return {
    id: bruto.id,
    titulo: bruto.titulo,
    descricao: texto(bruto.descricao),
    categoria,
    modalidade,
    inicio,
    fim,
    local: texto(bruto.local, "Local a definir"),
    organizador: texto(bruto.organizador, "Organização não informada"),
    vagas,
    vagasRestantes: Math.min(vagas, Math.max(0, numero(bruto.vagasRestantes, vagas))),
    gratuito: bruto.gratuito !== false,
    preco: numero(bruto.preco),
    situacao: bruto.situacao === "cancelado" ? "cancelado" : "confirmado",
    inscricoesAte: dataValida(bruto.inscricoesAte) ? bruto.inscricoesAte : undefined,
    link: typeof bruto.link === "string" ? bruto.link : undefined,
    tags: Array.isArray(bruto.tags)
      ? bruto.tags.filter((t: unknown): t is string => typeof t === "string")
      : [],
  };
}
