import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "./ui/PressableScale";
import { COLORS } from "../theme/colors";
import { criarEstilos } from "../theme/criarEstilos";
import { GUTTER } from "../theme/tokens";

type Props = {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  tom?: "aviso" | "info";
  acao?: string;
  onAcao?: () => void;
};

/** Faixa de aviso no topo das listas (ex.: "mostrando dados salvos"). */
export default function BannerAviso({ icone, texto, tom = "aviso", acao, onAcao }: Props) {
  const aviso = tom === "aviso";

  return (
    <View
      style={[
        styles.faixa,
        { backgroundColor: aviso ? COLORS.warningBackground : COLORS.primaryBackground },
      ]}
      accessibilityRole="alert"
    >
      <Ionicons name={icone} size={18} color={aviso ? COLORS.warning : COLORS.text} />
      <Text style={styles.texto}>{texto}</Text>

      {acao && onAcao ? (
        <PressableScale onPress={onAcao} accessibilityRole="button" accessibilityLabel={acao}>
          <Text style={styles.acao}>{acao}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = criarEstilos(() => ({
  faixa: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: GUTTER,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  texto: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  acao: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    textDecorationLine: "underline",
  },
}));
