import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import "react-native-reanimated";

import { configurarNotificacoes } from "../src/services/lembretes";
import { EventosProvider } from "../src/state/EventosContext";
import { COLORS } from "../src/theme/colors";
import { TemaProvider, useTema } from "../src/theme/TemaProvider";

export const unstable_settings = {
  anchor: "(tabs)",
};

/** Tema de navegação alinhado com as cores do app (evita "piscar" de outra cor). */
function temaDeNavegacao() {
  const base = COLORS.esquema === "escuro" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.text,
      border: COLORS.borderSoft,
      notification: COLORS.thread,
    },
  };
}

function Navegacao() {
  const { esquema } = useTema();
  const router = useRouter();

  /* Notificações: configura o canal uma vez ao abrir o app */
  useEffect(() => {
    configurarNotificacoes().catch(() => {
      // sem notificações o resto do app continua funcionando
    });
  }, []);

  /*
   * Quando a pessoa toca no lembrete (com o app aberto, em segundo plano ou
   * fechado), abre direto os detalhes do evento. `useLastNotificationResponse`
   * também devolve o toque que abriu o app do zero.
   */
  const resposta = Notifications.useLastNotificationResponse();
  const tratada = useRef<string | null>(null);

  useEffect(() => {
    if (!resposta) return;
    if (resposta.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const chave = resposta.notification.request.identifier;
    if (tratada.current === chave) return;

    const eventoId = resposta.notification.request.content.data?.eventoId;
    if (typeof eventoId === "string") {
      tratada.current = chave;
      router.push({ pathname: "/evento/[id]", params: { id: eventoId } });
    }
  }, [resposta, router]);

  return (
    <ThemeProvider value={temaDeNavegacao()}>
      {/*
        A chave faz as telas serem recriadas quando o tema muda,
        e assim todas leem as cores do tema novo.
      */}
      <Stack
        key={esquema}
        screenOptions={{
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Detalhes do evento: empilha por cima das abas */}
        <Stack.Screen name="evento/[id]" options={{ headerShown: false }} />

        {/* Formulário de inscrição: abre como folha por cima de tudo */}
        <Stack.Screen
          name="inscricao/[id]"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>

      <StatusBar style={COLORS.statusBar} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      {/* Os eventos ficam acima da navegação: trocar de tema recria as telas, mas não recarrega os dados */}
      <EventosProvider>
        <Navegacao />
      </EventosProvider>
    </TemaProvider>
  );
}
