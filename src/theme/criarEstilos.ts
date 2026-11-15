import { StyleSheet } from "react-native";

import type { Esquema } from "./paletas";
import { esquemaAtual } from "./tema";

/** Formato aceito pelo StyleSheet.create (tirado dele, para valer em qualquer versão do RN). */
type EntradaEstilos = Parameters<typeof StyleSheet.create>[0];

/**
 * Igual ao StyleSheet.create, mas refeito para cada tema.
 *
 * Em vez de receber o objeto pronto, recebe uma função que devolve os
 * estilos. Ela roda uma vez por tema (na primeira vez que ele é usado) e o
 * resultado fica guardado. Assim `styles.cartao` sempre aponta para o estilo
 * do tema que está valendo.
 */
export function criarEstilos<T extends EntradaEstilos>(fabrica: () => T): T {
  const guardados: Partial<Record<Esquema, T>> = {};

  function doTema(): T {
    const esquema = esquemaAtual();
    const existente = guardados[esquema];
    if (existente) return existente;

    const novo = StyleSheet.create(fabrica()) as unknown as T;
    guardados[esquema] = novo;
    return novo;
  }

  // Só a leitura (styles.cartao) é interceptada; cada estilo devolvido é um
  // objeto de verdade, criado pelo StyleSheet.create do React Native.
  return new Proxy({} as T, {
    get: (_alvo, chave) => (doTema() as any)[chave],
  });
}
