import { Alert, Linking, Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { CANAL_LEMBRETES } from "../config";
import { Evento } from "../types/Evento";
import { dataHoraCurta, paraData, rotuloRelativo } from "../utils/datas";
import { disponibilidadeDoEvento } from "../utils/disponibilidade";
import { CAMINHO_AJUSTES_NOTIFICACAO } from "../utils/plataforma";
import { antecedenciaEmMs } from "./preferencias";

/*
 * Lembretes de eventos favoritos = notificações LOCAIS agendadas no aparelho.
 * Não precisam de internet nem de servidor: o sistema dispara no horário.
 */

/** Chamar uma vez ao abrir o app: define como a notificação aparece e cria o canal. */
export async function configurarNotificacoes() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Só o Android tem "canais" de notificação (Platform.OS evita chamar no iOS).
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
      name: "Lembretes de eventos",
      description: "Avisos dos eventos que você favoritou",
      // AndroidImportance existe no expo-notifications; o lint não enxerga esse re-export.
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7C5CFF",
    });
  }
}

export type SituacaoPermissao = "concedida" | "negada" | "bloqueada";

/** Consulta o estado atual sem perguntar nada ao usuário. */
export async function consultarPermissao(): Promise<SituacaoPermissao> {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return "concedida";
  return p.canAskAgain ? "negada" : "bloqueada";
}

function confirmar(titulo: string, mensagem: string, confirmarRotulo: string): Promise<boolean> {
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: "Agora não", style: "cancel", onPress: () => resolver(false) },
        { text: confirmarRotulo, onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) }
    );
  });
}

/**
 * Garante a permissão de notificação explicando o motivo ANTES de abrir o
 * pedido do sistema:
 *  - já concedida: segue;
 *  - ainda dá para pedir: explica, pede e devolve o resultado;
 *  - bloqueada: o sistema não deixa mais perguntar, então orienta e
 *    oferece abrir as configurações do app.
 */
export async function garantirPermissao(): Promise<SituacaoPermissao> {
  const atual = await consultarPermissao();
  if (atual === "concedida") return "concedida";

  if (atual === "negada") {
    const quer = await confirmar(
      "Receber lembretes?",
      "Para avisar você antes dos eventos favoritos, o Eventos 360 precisa de permissão para enviar notificações. Elas ficam só no seu aparelho.",
      "Permitir"
    );
    if (!quer) return "negada";

    const resposta = await Notifications.requestPermissionsAsync();
    if (resposta.granted) return "concedida";
    return resposta.canAskAgain ? "negada" : "bloqueada";
  }

  // bloqueada
  Alert.alert(
    "Notificações desativadas",
    `Sem essa permissão não conseguimos lembrar você dos eventos. ${CAMINHO_AJUSTES_NOTIFICACAO}`,
    [
      { text: "Agora não", style: "cancel" },
      { text: "Abrir configurações", onPress: () => Linking.openSettings() },
    ]
  );
  return "bloqueada";
}

export type ResultadoLembrete =
  | { tipo: "agendado"; id: string; quando: Date }
  | { tipo: "sem_permissao"; bloqueada: boolean }
  | { tipo: "fora_da_janela" }
  | { tipo: "indisponivel" };

/** Momento em que o lembrete deve tocar para este evento. */
export function momentoDoLembrete(evento: Evento): Date {
  return new Date(paraData(evento.inicio).getTime() - antecedenciaEmMs());
}

/**
 * Agenda o lembrete de um evento favorito.
 *  - evento cancelado/encerrado não recebe lembrete;
 *  - se o horário do lembrete já passou (ex.: faltam 20 min e a escolha é
 *    "1 hora antes"), devolve "fora_da_janela" em vez de disparar na hora.
 */
export async function agendarLembrete(
  evento: Evento,
  pedirPermissao = true
): Promise<ResultadoLembrete> {
  const agora = new Date();
  const disp = disponibilidadeDoEvento(evento, agora);
  if (disp === "encerrado" || disp === "cancelado") return { tipo: "indisponivel" };

  const permissao = pedirPermissao ? await garantirPermissao() : await consultarPermissao();
  if (permissao !== "concedida") {
    return { tipo: "sem_permissao", bloqueada: permissao === "bloqueada" };
  }

  const quando = momentoDoLembrete(evento);
  if (quando.getTime() <= agora.getTime() + 5_000) return { tipo: "fora_da_janela" };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Já já: ${evento.titulo}`,
      body: `${rotuloRelativo(evento.inicio)} · ${dataHoraCurta(evento.inicio)} · ${evento.local}`,
      data: { eventoId: evento.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quando,
      channelId: CANAL_LEMBRETES,
    },
  });

  return { tipo: "agendado", id, quando };
}

export async function cancelarLembrete(id: string | null) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // já tinha disparado ou sido removido: nada a fazer
  }
}

/** Notificação de teste: toca em poucos segundos, para conferir se tudo funciona. */
export async function agendarTeste(segundos = 5): Promise<ResultadoLembrete> {
  const permissao = await garantirPermissao();
  if (permissao !== "concedida") {
    return { tipo: "sem_permissao", bloqueada: permissao === "bloqueada" };
  }

  const quando = new Date(Date.now() + segundos * 1000);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Eventos 360",
      body: "Lembretes funcionando! É assim que você será avisado dos favoritos.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: quando,
      channelId: CANAL_LEMBRETES,
    },
  });

  return { tipo: "agendado", id, quando };
}
