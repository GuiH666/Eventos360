// API REST local do Eventos 360 (opcional, sem dependências).
//
//   node api/servidor.mjs            -> http://localhost:3000
//   PORT=4000 node api/servidor.mjs  -> outra porta
//
// Endpoints (todos GET, resposta em JSON):
//   /saude                 -> { ok: true }
//   /eventos               -> lista completa  { versao, atualizadoEm, eventos: [...] }
//   /eventos?categoria=Oficina&modalidade=Online&q=react
//   /eventos/:id           -> um evento (404 se não existir)
//
// Os dados vêm de api/eventos.json, o mesmo arquivo que o GitHub serve em
// https://raw.githubusercontent.com/<usuario>/<repo>/main/api/eventos.json
// Para testar no celular, use o IP do computador: http://192.168.x.x:3000/eventos
// (configure em src/config.ts ou na variável EXPO_PUBLIC_API_EVENTOS).

import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
const PORTA = Number(process.env.PORT) || 3000;
/** Atraso artificial (ms) para ver o esqueleto de carregamento no app. */
const ATRASO = Number(process.env.ATRASO) || 0;

function lerBase() {
  return JSON.parse(readFileSync(join(aqui, "eventos.json"), "utf8"));
}

function responder(res, status, corpo) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(corpo));
}

function semAcento(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const servidor = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);

  setTimeout(() => {
    if (req.method !== "GET") return responder(res, 405, { erro: "Método não permitido" });

    if (url.pathname === "/saude") return responder(res, 200, { ok: true });

    const partes = url.pathname.split("/").filter(Boolean);
    if (partes[0] !== "eventos" && partes[0] !== "eventos.json") {
      return responder(res, 404, { erro: "Rota não encontrada" });
    }

    const base = lerBase();

    if (partes[1]) {
      const evento = base.eventos.find((e) => e.id === partes[1]);
      return evento
        ? responder(res, 200, evento)
        : responder(res, 404, { erro: "Evento não encontrado" });
    }

    const categoria = url.searchParams.get("categoria");
    const modalidade = url.searchParams.get("modalidade");
    const q = url.searchParams.get("q");

    const eventos = base.eventos.filter((e) => {
      if (categoria && e.categoria !== categoria) return false;
      if (modalidade && e.modalidade !== modalidade) return false;
      if (q) {
        const alvo = semAcento(`${e.titulo} ${e.descricao} ${e.local} ${(e.tags ?? []).join(" ")}`);
        if (!alvo.includes(semAcento(q))) return false;
      }
      return true;
    });

    responder(res, 200, { ...base, eventos });
  }, ATRASO);
});

servidor.listen(PORTA, "0.0.0.0", () => {
  console.log(`API do Eventos 360 em http://localhost:${PORTA}/eventos`);
});
