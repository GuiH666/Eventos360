import Storage from "expo-sqlite/kv-store";

/*
 * Preferências do usuário, guardadas no armazenamento chave-valor do Expo.
 * Toda leitura/escrita é protegida: se o armazenamento falhar, o app
 * continua funcionando com os valores padrão.
 */

/** Quanto tempo antes do evento o lembrete deve tocar. */
export type Antecedencia = "1d" | "1h" | "15m";

export const ANTECEDENCIAS: { valor: Antecedencia; rotulo: string; ms: number }[] = [
  { valor: "1d", rotulo: "1 dia antes", ms: 24 * 60 * 60 * 1000 },
  { valor: "1h", rotulo: "1 hora antes", ms: 60 * 60 * 1000 },
  { valor: "15m", rotulo: "15 min antes", ms: 15 * 60 * 1000 },
];

export type Contato = {
  nome: string;
  email: string;
  telefone: string;
  curso: string;
};

const CHAVE_ANTECEDENCIA = "lembrete.antecedencia";
const CHAVE_LEMBRAR = "lembrete.aoFavoritar";
const CHAVE_CONTATO = "contato";

function ler(chave: string): string | null {
  try {
    return Storage.getItemSync(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string) {
  try {
    Storage.setItemSync(chave, valor);
  } catch {
    // sem armazenamento: vale só até fechar o app
  }
}

export function lerAntecedencia(): Antecedencia {
  const v = ler(CHAVE_ANTECEDENCIA);
  return v === "1d" || v === "1h" || v === "15m" ? v : "1h";
}

export function salvarAntecedencia(valor: Antecedencia) {
  gravar(CHAVE_ANTECEDENCIA, valor);
}

export function antecedenciaEmMs(valor: Antecedencia = lerAntecedencia()): number {
  return ANTECEDENCIAS.find((a) => a.valor === valor)?.ms ?? 60 * 60 * 1000;
}

/** Se favoritar um evento já agenda o lembrete (padrão: sim). */
export function lerLembrarAoFavoritar(): boolean {
  return ler(CHAVE_LEMBRAR) !== "nao";
}

export function salvarLembrarAoFavoritar(valor: boolean) {
  gravar(CHAVE_LEMBRAR, valor ? "sim" : "nao");
}

/** Últimos dados digitados no formulário, para não digitar tudo de novo. */
export function lerContato(): Contato {
  const vazio: Contato = { nome: "", email: "", telefone: "", curso: "" };
  const texto = ler(CHAVE_CONTATO);
  if (!texto) return vazio;

  try {
    const c = JSON.parse(texto);
    return {
      nome: typeof c.nome === "string" ? c.nome : "",
      email: typeof c.email === "string" ? c.email : "",
      telefone: typeof c.telefone === "string" ? c.telefone : "",
      curso: typeof c.curso === "string" ? c.curso : "",
    };
  } catch {
    return vazio;
  }
}

export function salvarContato(contato: Contato) {
  gravar(CHAVE_CONTATO, JSON.stringify(contato));
}
