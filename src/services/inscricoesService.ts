import { banco } from "../database/banco";
import { Inscricao, NovaInscricao } from "../types/Evento";

/** Inscrições (e manifestações de interesse), da mais recente para a mais antiga. */
export function listarInscricoes(): Inscricao[] {
  return banco().getAllSync<Inscricao>(
    "SELECT * FROM inscricoes ORDER BY criadoEm DESC"
  );
}

export function buscarInscricoesDoEvento(eventoId: string): Inscricao[] {
  return banco().getAllSync<Inscricao>(
    "SELECT * FROM inscricoes WHERE eventoId = ? ORDER BY criadoEm DESC",
    [eventoId]
  );
}

/**
 * Salva a inscrição. O mesmo e-mail não pode se inscrever duas vezes no
 * mesmo evento (restrição UNIQUE do banco), e isso vira uma mensagem clara.
 */
export function salvarInscricao(dados: NovaInscricao): number {
  try {
    const resultado = banco().runSync(
      `INSERT INTO inscricoes
        (eventoId, eventoTitulo, eventoInicio, tipo, nome, email,
         telefone, curso, observacao, criadoEm)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dados.eventoId,
        dados.eventoTitulo,
        dados.eventoInicio,
        dados.tipo,
        dados.nome.trim(),
        dados.email.trim().toLowerCase(),
        dados.telefone,
        dados.curso.trim(),
        dados.observacao.trim(),
        new Date().toISOString(),
      ]
    );
    return resultado.lastInsertRowId;
  } catch (e: any) {
    if (String(e?.message).includes("UNIQUE")) {
      throw new Error("Este e-mail já está registrado neste evento.");
    }
    throw e;
  }
}

export function removerInscricao(id: number) {
  banco().runSync("DELETE FROM inscricoes WHERE id = ?", [id]);
}
