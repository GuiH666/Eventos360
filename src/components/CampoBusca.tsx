import React from "react";
import { TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "./ui/PressableScale";
import { COLORS } from "../theme/colors";
import { criarEstilos } from "../theme/criarEstilos";
import { GUTTER } from "../theme/tokens";

type Props = {
  valor: string;
  onMudar: (texto: string) => void;
  placeholder?: string;
};

/** Caixa de busca com botão de limpar. */
export default function CampoBusca({ valor, onMudar, placeholder }: Props) {
  return (
    <View style={styles.caixa}>
      <Ionicons name="search" size={20} color={COLORS.textMuted} />

      <TextInput
        value={valor}
        onChangeText={onMudar}
        placeholder={placeholder ?? "Buscar eventos"}
        placeholderTextColor={COLORS.textMuted}
        selectionColor={COLORS.primaryLight}
        cursorColor={COLORS.primaryLight}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Buscar eventos"
        style={styles.input}
      />

      {valor.length > 0 ? (
        <PressableScale
          escala={0.85}
          hitSlop={10}
          onPress={() => onMudar("")}
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
        >
          <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = criarEstilos(() => ({
  caixa: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: GUTTER,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  input: {
    flex: 1,
    height: "100%",
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    padding: 0,
  },
}));
