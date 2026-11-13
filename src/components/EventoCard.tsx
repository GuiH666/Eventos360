import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import PressableScale from "./ui/PressableScale";
import Selo, { SeloDisponibilidade } from "./Selo";
import { COLORS } from "../theme/colors";
import { criarEstilos } from "../theme/criarEstilos";
import { TYPE } from "../theme/tokens";
import { Evento } from "../types/Evento";
import { visualDaCategoria } from "../utils/categorias";
import { hora, seloDeData } from "../utils/datas";
import { disponibilidadeDoEvento } from "../utils/disponibilidade";
import { haptics } from "../utils/haptics";

type Props = {
  evento: Evento;
  favorito: boolean;
  agora: Date;
  onAbrir: (evento: Evento) => void;
  onFavoritar: (evento: Evento) => void;
  /** Mostra o botão de coração (false em telas onde ele não faz sentido) */
  comCoracao?: boolean;
};

/**
 * Cartão de evento usado nas listas. Os dados chegam por props; o cartão
 * não sabe de onde vêm, só desenha e avisa (com o próprio evento) o que foi
 * tocado. Como as funções recebidas são estáveis, o React.memo evita
 * redesenhar os cartões que não mudaram.
 */
function EventoCard({
  evento,
  favorito,
  agora,
  onAbrir,
  onFavoritar,
  comCoracao = true,
}: Props) {
  const disp = disponibilidadeDoEvento(evento, agora);
  const visual = visualDaCategoria(evento.categoria);
  const apagado = disp === "encerrado" || disp === "cancelado";
  const selo = seloDeData(evento.inicio);

  return (
    <PressableScale
      onPress={() => {
        haptics.toque();
        onAbrir(evento);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${evento.titulo}, ${evento.categoria}, ${evento.modalidade}`}
      style={[styles.cartao, apagado && styles.apagado]}
    >
      <View style={[styles.data, { backgroundColor: visual.fundo }]}>
        <Text style={[styles.dia, { color: visual.texto }]}>{selo.dia}</Text>
        <Text style={[styles.mes, { color: visual.texto }]}>{selo.mes}</Text>
      </View>

      <View style={styles.corpo}>
        <View style={styles.linhaCategoria}>
          <Ionicons name={visual.icone} size={14} color={COLORS.textMuted} />
          <Text style={styles.categoria} numberOfLines={1}>
            {evento.categoria}
          </Text>
        </View>

        <Text
          style={[styles.titulo, disp === "cancelado" && styles.tituloRiscado]}
          numberOfLines={2}
        >
          {evento.titulo}
        </Text>

        <View style={styles.linhaInfo}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.info} numberOfLines={1}>
            {hora(evento.inicio)} · {evento.local}
          </Text>
        </View>

        <View style={styles.selos}>
          <Selo rotulo={evento.modalidade} />
          <SeloDisponibilidade evento={evento} disponibilidade={disp} />
        </View>
      </View>

      {comCoracao ? (
        <PressableScale
          escala={0.85}
          hitSlop={8}
          style={styles.coracao}
          accessibilityRole="button"
          accessibilityLabel={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          accessibilityState={{ selected: favorito }}
          onPress={() => {
            if (favorito) haptics.toque();
            else haptics.medio();
            onFavoritar(evento);
          }}
        >
          <Ionicons
            name={favorito ? "heart" : "heart-outline"}
            size={24}
            color={favorito ? COLORS.danger : COLORS.textMuted}
          />
        </PressableScale>
      ) : null}
    </PressableScale>
  );
}

/* O cartão só redesenha quando algo que ele mostra muda. */
export default React.memo(EventoCard);

const styles = criarEstilos(() => ({
  cartao: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
  },

  apagado: {
    opacity: 0.6,
  },

  data: {
    width: 66,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },

  dia: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },

  mes: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  corpo: {
    flex: 1,
    paddingVertical: 2,
    paddingRight: 30,
    gap: 4,
  },

  linhaCategoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  categoria: {
    ...TYPE.small,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  titulo: {
    ...TYPE.bodyStrong,
    fontSize: 17,
    lineHeight: 22,
  },

  tituloRiscado: {
    textDecorationLine: "line-through",
  },

  linhaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  info: {
    ...TYPE.caption,
    flexShrink: 1,
  },

  selos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },

  coracao: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
}));
