/**
 * Configurações do app.
 *
 * A API do Eventos 360 é uma API REST de leitura (GET) que devolve JSON.
 * Por padrão ela é servida pelo próprio GitHub (arquivo api/eventos.json do
 * repositório, que precisa estar PÚBLICO). Para usar outro endereço sem mexer
 * no código, crie um arquivo .env com:
 *
 *   EXPO_PUBLIC_API_EVENTOS=http://192.168.0.10:3000/eventos
 *
 * (o servidor local fica em api/servidor.mjs).
 */
export const API_EVENTOS: string =
  process.env.EXPO_PUBLIC_API_EVENTOS ??
  "https://raw.githubusercontent.com/GuiH666/Eventos360/main/api/eventos.json";

/** Tempo máximo de espera pela API antes de considerar falha de comunicação. */
export const TIMEOUT_API_MS = 10_000;

/** Canal de notificações do Android (no iOS não existe canal). */
export const CANAL_LEMBRETES = "lembretes";
