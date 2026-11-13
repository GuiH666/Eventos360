import { banco } from "../database/banco";
import { Evento, Favorito } from "../types/Evento";

type Linha = {
  eventoId: string;
  dados: string;
  notificacaoId: string | null;
  criadoEm: string;
};

function paraFavorito(l: Linha): Favorito | null {
  try {
    return {
      eventoId: l.eventoId,
      dados: JSON.parse(l.dados) as Evento,
      notificacaoId: l.notificacaoId,
      criadoEm: l.criadoEm,
    };
  } catch {
    return null;
  }
}

/** Favoritos, do mais recente para o mais antigo. */
export function listarFavoritos(): Favorito[] {
  const linhas = banco().getAllSync<Linha>(
    "SELECT * FROM favoritos ORDER BY criadoEm DESC"
  );

  return linhas.map(paraFavorito).filter((f): f is Favorito => f !== null);
}

export function buscarFavorito(eventoId: string): Favorito | null {
  const linha = banco().getFirstSync<Linha>(
    "SELECT * FROM favoritos WHERE eventoId = ?",
    [eventoId]
  );
  return linha ? paraFavorito(linha) : null;
}

export function adicionarFavorito(evento: Evento, notificacaoId: string | null = null) {
  banco().runSync(
    `INSERT OR REPLACE INTO favoritos (eventoId, dados, notificacaoId, criadoEm)
     VALUES (?, ?, ?, ?)`,
    [evento.id, JSON.stringify(evento), notificacaoId, new Date().toISOString()]
  );
}

export function removerFavorito(eventoId: string) {
  banco().runSync("DELETE FROM favoritos WHERE eventoId = ?", [eventoId]);
}

export function definirNotificacao(eventoId: string, notificacaoId: string | null) {
  banco().runSync("UPDATE favoritos SET notificacaoId = ? WHERE eventoId = ?", [
    notificacaoId,
    eventoId,
  ]);
}

/** Atualiza a cópia guardada quando a API traz dados novos do evento. */
export function atualizarDadosDoFavorito(evento: Evento) {
  banco().runSync("UPDATE favoritos SET dados = ? WHERE eventoId = ?", [
    JSON.stringify(evento),
    evento.id,
  ]);
}
