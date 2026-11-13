import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PressableScale from "./ui/PressableScale";
import { COLORS } from "../theme/colors";
import { haptics } from "../utils/haptics";
import { criarEstilos } from "../theme/criarEstilos";

/*
 * O que a barra recebe do Expo Router (só o que ela usa).
 * Declarado aqui porque, a partir do SDK 56, o app não pode mais importar
 * de pacotes @react-navigation/* diretamente.
 */
type BottomTabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  /** Pode não vir em todas as versões do SDK: por isso a navegação usa o router. */
  navigation?: any;
};

type Aba = {
  nome: string;
  href: "/" | "/favoritos" | "/inscricoes" | "/ajustes";
  rotulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  iconeAtivo: keyof typeof Ionicons.glyphMap;
};

/** Ordem e aparência das abas. A que não estiver aqui fica escondida. */
const ABAS: Aba[] = [
  { nome: "index", href: "/", rotulo: "Eventos", icone: "calendar-outline", iconeAtivo: "calendar" },
  { nome: "favoritos", href: "/favoritos", rotulo: "Favoritos", icone: "heart-outline", iconeAtivo: "heart" },
  { nome: "inscricoes", href: "/inscricoes", rotulo: "Inscrições", icone: "ticket-outline", iconeAtivo: "ticket" },
  { nome: "ajustes", href: "/ajustes", rotulo: "Ajustes", icone: "options-outline", iconeAtivo: "options" },
];

/**
 * Barra de abas própria: uma cápsula flutuante com as 4 abas do app.
 */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const rotaAtiva = state.routes[state.index]?.name;

  function renderAba(aba: Aba) {
    const rota = state.routes.find((r) => r.name === aba.nome);
    if (!rota) return null;

    const ativa = rotaAtiva === aba.nome;

    return (
      <PressableScale
        key={aba.nome}
        escala={0.92}
        style={styles.aba}
        accessibilityRole="tab"
        accessibilityLabel={aba.rotulo}
        accessibilityState={{ selected: ativa }}
        onPress={() => {
          if (ativa) return;

          // Avisa a navegação (quando ela oferece o evento) e troca de aba pelo router,
          // que funciona igual em qualquer versão do SDK.
          const evento = navigation?.emit?.({
            type: "tabPress",
            target: rota.key,
            canPreventDefault: true,
          });

          if (!evento?.defaultPrevented) {
            haptics.toque();
            router.navigate(aba.href);
          }
        }}
      >
        <View
          key={ativa ? "ativa" : "inativa"}
          style={[styles.indicador, ativa && styles.indicadorAtivo]}
        >
          <Ionicons
            name={ativa ? aba.iconeAtivo : aba.icone}
            size={22}
            color={ativa ? COLORS.onPrimary : COLORS.textMuted}
          />
        </View>

        <Text style={[styles.rotulo, ativa && styles.rotuloAtivo]}>
          {aba.rotulo}
        </Text>
      </PressableScale>
    );
  }

  return (
    <View
      style={[styles.moldura, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
    <View style={styles.barra}>
      {ABAS.map(renderAba)}
    </View>
    </View>
  );
}

const styles = criarEstilos(() => ({
  /* A barra flutua: uma cápsula com margem em volta, sobre o fundo da tela */
  moldura: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  barra: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 34,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  aba: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    gap: 4,
  },

  /* Pílula atrás do ícone: acende na aba ativa */
  indicador: {
    width: 54,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  indicadorAtivo: {
    backgroundColor: COLORS.primary,
  },

  rotulo: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.1,
    color: COLORS.textMuted,
  },

  rotuloAtivo: {
    color: COLORS.text,
  },
}));
