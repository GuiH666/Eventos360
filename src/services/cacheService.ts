import { banco } from "../database/banco";
import { Evento } from "../types/Evento";

/** Cópia local da última resposta da API (usada quando não há internet). */

export type CacheEventos = {
  eventos: Evento[];
  /** Quando a cópia foi baixada (ISO) */
  sincronizadoEm: string;
};

export function salvarCache(eventos: Evento[], sincronizadoEm: string) {
  const db = banco();

  db.withTransactionSync(() => {
    db.runSync("DELETE FROM cache_eventos");
    for (const e of eventos) {
      db.runSync("INSERT INTO cache_eventos (id, dados) VALUES (?, ?)", [
        e.id,
        JSON.stringify(e),
      ]);
    }
    db.runSync(
      "INSERT OR REPLACE INTO meta (chave, valor) VALUES ('sincronizadoEm', ?)",
      [sincronizadoEm]
    );
  });
}

export function lerCache(): CacheEventos | null {
  const db = banco();

  const meta = db.getFirstSync<{ valor: string }>(
    "SELECT valor FROM meta WHERE chave = 'sincronizadoEm'"
  );
  if (!meta) return null;

  const linhas = db.getAllSync<{ dados: string }>("SELECT dados FROM cache_eventos");
  const eventos: Evento[] = [];

  for (const linha of linhas) {
    try {
      eventos.push(JSON.parse(linha.dados) as Evento);
    } catch {
      // linha corrompida: ignora e segue
    }
  }

  return { eventos, sincronizadoEm: meta.valor };
}

export function limparCache() {
  const db = banco();
  db.runSync("DELETE FROM cache_eventos");
  db.runSync("DELETE FROM meta WHERE chave = 'sincronizadoEm'");
}
