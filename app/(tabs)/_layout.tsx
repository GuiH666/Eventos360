import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TabBar from "../../src/components/TabBar";
import { COLORS } from "../../src/theme/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // O espaço do topo (relógio, bateria) fica reservado aqui, para o
        // conteúdo não passar por baixo da barra de status ao rolar.
        sceneStyle: {
          backgroundColor: COLORS.background,
          paddingTop: insets.top,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Eventos" }} />
      <Tabs.Screen name="favoritos" options={{ title: "Favoritos" }} />
      <Tabs.Screen name="inscricoes" options={{ title: "Inscrições" }} />
      <Tabs.Screen name="ajustes" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}
