import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "./ui/PressableScale";
import { COLORS } from "../theme/colors";
import { criarEstilos } from "../theme/criarEstilos";
import { glow, GUTTER } from "../theme/tokens";
import { Evento } from "../types/Evento";
import { dataHoraCurta, diasEntre, hora, paraData } from "../utils/datas";
import { haptics } from "../utils/haptics";

type Props = {
  evento: Evento;
  agora: Date;
  onAbrir: (evento: Evento) => void;
};

/** Texto da contagem regressiva: "Começa em 3 dias", "Começa hoje às 20:00"... */
function contagem(evento: Evento, agora: Date): string {
  const inicio = paraData(evento.inicio);

  if (inicio.getTime() <= agora.getTime()) return "Acontecendo agora";

  const dias = diasEntre(agora, inicio);
  if (dias === 0) return `Começa hoje às ${hora(inicio)}`;
  if (dias === 1) return `Começa amanhã às ${hora(inicio)}`;
  return `Começa em ${dias} dias`;
}

/**
 * Destaque no topo da lista: o próximo evento que vai acontecer.
 * Fundo violeta com círculos decorativos, para ser a primeira coisa que o olho vê.
 */
export default function ProximoEvento({ evento, agora, onAbrir }: Props) {
  return (
    <View style={styles.moldura}>
      <PressableScale
        onPress={() => {
          haptics.medio();
          onAbrir(evento);
        }}
        accessibilityRole="button"
        accessibilityLabel={`Próximo evento: ${evento.titulo}. ${contagem(evento, agora)}`}
        style={[styles.cartao, glow()]}
      >
        {/* círculos decorativos */}
        <View pointerEvents="none" style={styles.circuloGrande} />
        <View pointerEvents="none" style={styles.circuloPequeno} />

        <View style={styles.selo}>
          <Ionicons name="flash" size={13} color={COLORS.primary} />
          <Text style={styles.seloTexto}>PRÓXIMO EVENTO</Text>
        </View>

        <Text style={styles.titulo} numberOfLines={2}>
          {evento.titulo}
        </Text>

        <Text style={styles.contagem}>{contagem(evento, agora)}</Text>

        <View style={styles.rodape}>
          <View style={styles.dados}>
            <View style={styles.linha}>
              <Ionicons name="calendar-outline" size={15} color={COLORS.heroTextSoft} />
              <Text style={styles.dado}>{dataHoraCurta(evento.inicio)}</Text>
            </View>
            <View style={styles.linha}>
              <Ionicons name="location-outline" size={15} color={COLORS.heroTextSoft} />
              <Text style={styles.dado} numberOfLines={1}>
                {evento.local}
              </Text>
            </View>
          </View>

          <View style={styles.seta}>
            <Ionicons name="arrow-forward" size={22} color={COLORS.primary} />
          </View>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = criarEstilos(() => ({
  moldura: {
    paddingHorizontal: GUTTER,
    marginBottom: 18,
  },

  cartao: {
    backgroundColor: COLORS.heroBg,
    borderRadius: 30,
    padding: 20,
    gap: 6,
    overflow: "hidden",
  },

  circuloGrande: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -80,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  circuloPequeno: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    right: 40,
    bottom: -50,
    backgroundColor: COLORS.heroAccent,
    opacity: 0.9,
  },

  selo: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: COLORS.heroText,
  },

  seloTexto: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  titulo: {
    color: COLORS.heroText,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.9,
    lineHeight: 30,
    marginTop: 8,
    paddingRight: 40,
  },

  contagem: {
    color: COLORS.heroAccent,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  rodape: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 14,
  },

  dados: {
    flex: 1,
    gap: 5,
    paddingRight: 12,
  },

  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dado: {
    color: COLORS.heroTextSoft,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },

  seta: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.heroText,
    alignItems: "center",
    justifyContent: "center",
  },
}));
