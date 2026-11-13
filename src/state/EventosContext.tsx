import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Evento, Favorito } from "../types/Evento";
import { ErroApi, buscarEventosApi } from "../services/apiEventos";
import { lerCache, salvarCache } from "../services/cacheService";
import {
  adicionarFavorito,
  atualizarDadosDoFavorito,
  definirNotificacao,
  listarFavoritos,
  removerFavorito,
} from "../services/favoritosService";
import {
  ResultadoLembrete,
  agendarLembrete,
  cancelarLembrete,
} from "../services/lembretes";
import { lerLembrarAoFavoritar } from "../services/preferencias";
import { dataHoraCurta } from "../utils/datas";
import { disponibilidadeDoEvento } from "../utils/disponibilidade";

/** Estado da carga dos eventos (o que a tela precisa para escolher o que mostrar). */
export type StatusEventos = "carregando" | "ok" | "erro";

/** De onde vieram os eventos que estão na tela. */
export type OrigemEventos = "api" | "cache";

type ValorEventos = {
  status: StatusEventos;
  eventos: Evento[];
  origem: OrigemEventos | null;
  /** Quando a lista foi baixada pela última vez (ISO) */
  sincronizadoEm: string | null;
  /** Falha da última tentativa (mesmo quando há cópia salva para mostrar) */
  erro: unknown;
  /** Há uma atualização em andamento */
  atualizando: boolean;
  /** "Agora", atualizado a cada minuto: mantém badges e contagens em dia */
  agora: Date;
  recarregar: () => Promise<void>;

  favoritos: Favorito[];
  ehFavorito: (eventoId: string) => boolean;
  /** Favorita/desfavorita e cuida do lembrete. Devolve o texto para o aviso. */
  alternarFavorito: (evento: Evento) => Promise<string>;
  /** Liga ou desliga só o lembrete de um favorito. Devolve o texto para o aviso. */
  alternarLembrete: (evento: Evento) => Promise<string>;
  /** Refaz os lembretes (usado quando a antecedência muda). */
  reagendarLembretes: () => Promise<number>;

  buscarEvento: (eventoId: string) => Evento | undefined;
};

const Contexto = createContext<ValorEventos | null>(null);

function textoDoResultado(r: ResultadoLembrete): string {
  switch (r.tipo) {
    case "agendado":
      return `Favoritado · lembrete ${dataHoraCurta(r.quando)}`;
    case "sem_permissao":
      return "Favoritado · lembrete desativado (sem permissão)";
    case "fora_da_janela":
      return "Favoritado · o evento começa antes do horário do lembrete";
    default:
      return "Favoritado";
  }
}

export function EventosProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<StatusEventos>("carregando");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [origem, setOrigem] = useState<OrigemEventos | null>(null);
  const [sincronizadoEm, setSincronizadoEm] = useState<string | null>(null);
  const [erro, setErro] = useState<unknown>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [agora, setAgora] = useState(() => new Date());

  const eventosRef = useRef<Evento[]>([]);
  useEffect(() => {
    eventosRef.current = eventos;
  }, [eventos]);

  const recarregarFavoritos = useCallback(() => {
    try {
      setFavoritos(listarFavoritos());
    } catch {
      setFavoritos([]);
    }
  }, []);

  /* O relógio da tela anda de minuto em minuto */
  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Depois de baixar eventos novos: atualiza a cópia dos favoritos e remove
   * o lembrete dos que foram cancelados ou já terminaram.
   */
  const sincronizarFavoritos = useCallback(async (novos: Evento[]) => {
    let mudou = false;

    for (const fav of listarFavoritos()) {
      const atual = novos.find((e) => e.id === fav.eventoId);
      if (!atual) continue;

      atualizarDadosDoFavorito(atual);
      mudou = true;

      const disp = disponibilidadeDoEvento(atual);
      if (fav.notificacaoId && (disp === "cancelado" || disp === "encerrado")) {
        await cancelarLembrete(fav.notificacaoId);
        definirNotificacao(fav.eventoId, null);
      }
    }

    if (mudou) recarregarFavoritos();
  }, [recarregarFavoritos]);

  const carregar = useCallback(async () => {
    setAtualizando(true);

    try {
      const resposta = await buscarEventosApi();
      const quando = new Date().toISOString();

      try {
        salvarCache(resposta.eventos, quando);
      } catch {
        // falhar ao salvar a cópia não deve esconder os eventos
      }

      setEventos(resposta.eventos);
      setOrigem("api");
      setSincronizadoEm(quando);
      setErro(null);
      setStatus("ok");

      await sincronizarFavoritos(resposta.eventos);
    } catch (e) {
      setErro(e instanceof ErroApi ? e : new ErroApi("rede", "Falha"));

      // Sem comunicação: usa o que já está na tela ou a cópia salva.
      let copia: { eventos: Evento[]; sincronizadoEm: string } | null = null;
      if (eventosRef.current.length === 0) {
        try {
          copia = lerCache();
        } catch {
          copia = null;
        }
      }

      if (eventosRef.current.length > 0) {
        setStatus("ok");
      } else if (copia) {
        setEventos(copia.eventos);
        setOrigem("cache");
        setSincronizadoEm(copia.sincronizadoEm);
        setStatus("ok");
      } else {
        setStatus("erro");
      }
    } finally {
      setAtualizando(false);
    }
  }, [sincronizarFavoritos]);

  /* Primeira carga: mostra a cópia salva na hora e atualiza pela API em seguida */
  useEffect(() => {
    recarregarFavoritos();

    try {
      const copia = lerCache();
      if (copia) {
        setEventos(copia.eventos);
        eventosRef.current = copia.eventos;
        setOrigem("cache");
        setSincronizadoEm(copia.sincronizadoEm);
        setStatus("ok");
      }
    } catch {
      // sem cópia: a tela mostra o esqueleto até a API responder
    }

    carregar();
  }, [carregar, recarregarFavoritos]);

  const ehFavorito = useCallback(
    (eventoId: string) => favoritos.some((f) => f.eventoId === eventoId),
    [favoritos]
  );

  const alternarFavorito = useCallback(
    async (evento: Evento): Promise<string> => {
      const existente = listarFavoritos().find((f) => f.eventoId === evento.id);

      if (existente) {
        await cancelarLembrete(existente.notificacaoId);
        removerFavorito(evento.id);
        recarregarFavoritos();
        return "Removido dos favoritos";
      }

      adicionarFavorito(evento);
      recarregarFavoritos();

      if (!lerLembrarAoFavoritar()) return "Favoritado";

      const resultado = await agendarLembrete(evento);
      if (resultado.tipo === "agendado") {
        definirNotificacao(evento.id, resultado.id);
        recarregarFavoritos();
      }
      return textoDoResultado(resultado);
    },
    [recarregarFavoritos]
  );

  const alternarLembrete = useCallback(
    async (evento: Evento): Promise<string> => {
      const fav = listarFavoritos().find((f) => f.eventoId === evento.id);
      if (!fav) return "Favorite o evento primeiro";

      if (fav.notificacaoId) {
        await cancelarLembrete(fav.notificacaoId);
        definirNotificacao(evento.id, null);
        recarregarFavoritos();
        return "Lembrete desligado";
      }

      const r = await agendarLembrete(evento);
      if (r.tipo === "agendado") {
        definirNotificacao(evento.id, r.id);
        recarregarFavoritos();
        return `Lembrete ligado · ${dataHoraCurta(r.quando)}`;
      }
      if (r.tipo === "sem_permissao") return "Lembrete não ligado: sem permissão";
      if (r.tipo === "fora_da_janela") return "O evento começa antes do horário do lembrete";
      return "Este evento não aceita lembretes";
    },
    [recarregarFavoritos]
  );

  const reagendarLembretes = useCallback(async (): Promise<number> => {
    let total = 0;

    for (const fav of listarFavoritos()) {
      await cancelarLembrete(fav.notificacaoId);
      definirNotificacao(fav.eventoId, null);

      const evento = eventosRef.current.find((e) => e.id === fav.eventoId) ?? fav.dados;
      const r = await agendarLembrete(evento, false);
      if (r.tipo === "agendado") {
        definirNotificacao(fav.eventoId, r.id);
        total += 1;
      }
    }

    recarregarFavoritos();
    return total;
  }, [recarregarFavoritos]);

  const buscarEvento = useCallback(
    (eventoId: string) => eventos.find((e) => e.id === eventoId),
    [eventos]
  );

  const valor = useMemo<ValorEventos>(
    () => ({
      status,
      eventos,
      origem,
      sincronizadoEm,
      erro,
      atualizando,
      agora,
      recarregar: carregar,
      favoritos,
      ehFavorito,
      alternarFavorito,
      alternarLembrete,
      reagendarLembretes,
      buscarEvento,
    }),
    [
      status,
      eventos,
      origem,
      sincronizadoEm,
      erro,
      atualizando,
      agora,
      carregar,
      favoritos,
      ehFavorito,
      alternarFavorito,
      alternarLembrete,
      reagendarLembretes,
      buscarEvento,
    ]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEventos(): ValorEventos {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useEventos precisa estar dentro de <EventosProvider>");
  return valor;
}
