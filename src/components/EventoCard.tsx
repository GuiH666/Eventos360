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

/** Pontinhos da picote do ingresso (separam a data do resto do cartão). */
const PICOTE = [0, 1, 2, 3, 4, 5, 6];

/**
 * Cartão de evento em formato de INGRESSO: a data fica no "canhoto" colorido
 * da categoria, separada do resto por uma linha de picote com dois recortes.
 *
 * Os dados chegam por props; o cartão não sabe de onde vêm, só desenha e
 * avisa (com o próprio evento) o que foi tocado. Como as funções recebidas
 * são estáveis, o React.memo evita redesenhar os cartões que não mudaram.
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
      {/* Canhoto: data */}
      <View style={[styles.canhoto, { backgroundColor: visual.fundo }]}>
        <Ionicons name={visual.icone} size={18} color={visual.texto} style={styles.iconeCanhoto} />
        <Text style={[styles.dia, { color: visual.texto }]}>{selo.dia}</Text>
        <Text style={[styles.mes, { color: visual.texto }]}>{selo.mes}</Text>
      </View>

      {/* Picote + recortes */}
      <View style={styles.picote}>
        <View style={[styles.recorte, styles.recorteTopo]} />
        <View style={styles.pontos}>
          {PICOTE.map((i) => (
            <View key={i} style={styles.ponto} />
          ))}
        </View>
        <View style={[styles.recorte, styles.recorteBase]} />
      </View>

      {/* Corpo */}
      <View style={styles.corpo}>
        <Text style={[styles.categoria, { color: COLORS.primaryLight }]} numberOfLines={1}>
          {evento.categoria}
        </Text>

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
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
  },

  apagado: {
    opacity: 0.6,
  },

  canhoto: {
    width: 68,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 0,
  },

  iconeCanhoto: {
    opacity: 0.85,
    marginBottom: 4,
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

  picote: {
    width: 22,
    alignItems: "center",
  },

  pontos: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },

  ponto: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },

  // Meio círculo com a cor do fundo da tela: parece um furo no ingresso.
  recorte: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    left: 1,
  },

  recorteTopo: {
    top: -23.5,
  },

  recorteBase: {
    bottom: -23.5,
  },

  corpo: {
    flex: 1,
    paddingVertical: 2,
    paddingRight: 30,
    gap: 4,
  },

  categoria: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.9,
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
