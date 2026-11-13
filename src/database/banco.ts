import * as SQLite from "expo-sqlite";

/*
 * Banco local (SQLite). Guarda o que precisa sobreviver ao fechar o app e
 * funcionar sem internet:
 *   - cache_eventos: última cópia da lista da API
 *   - favoritos:     eventos favoritados (com cópia dos dados e o id do lembrete)
 *   - inscricoes:    inscrições e manifestações de interesse
 *
 * Preferências simples (tema, antecedência do lembrete, último contato) ficam
 * no armazenamento chave-valor, em src/services/preferencias.ts.
 */
const db = SQLite.openDatabaseSync("eventos360.db");

/** Número da versão do esquema. Aumente ao mudar tabelas e adicione a migração. */
const VERSAO_ESQUEMA = 1;

let pronto = false;

function migrar() {
  const linha = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const atual = linha?.user_version ?? 0;

  if (atual < 1) {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS cache_eventos (
        id TEXT PRIMARY KEY NOT NULL,
        dados TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meta (
        chave TEXT PRIMARY KEY NOT NULL,
        valor TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS favoritos (
        eventoId TEXT PRIMARY KEY NOT NULL,
        dados TEXT NOT NULL,
        notificacaoId TEXT,
        criadoEm TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS inscricoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventoId TEXT NOT NULL,
        eventoTitulo TEXT NOT NULL,
        eventoInicio TEXT NOT NULL,
        tipo TEXT NOT NULL,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT NOT NULL DEFAULT '',
        curso TEXT NOT NULL DEFAULT '',
        observacao TEXT NOT NULL DEFAULT '',
        criadoEm TEXT NOT NULL,
        UNIQUE (eventoId, email)
      );
    `);
  }

  db.execSync(`PRAGMA user_version = ${VERSAO_ESQUEMA}`);
}

/** Devolve o banco já com as tabelas criadas (cria na primeira chamada). */
export function banco(): SQLite.SQLiteDatabase {
  if (!pronto) {
    migrar();
    pronto = true;
  }
  return db;
}
