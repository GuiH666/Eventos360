import React from "react";
import { Text, View } from "react-native";

import { COLORS } from "../theme/colors";
import { criarEstilos } from "../theme/criarEstilos";
import { Disponibilidade, Evento } from "../types/Evento";
import { ROTULO_DISPONIBILIDADE } from "../utils/disponibilidade";

type Tom = "neutro" | "sucesso" | "aviso" | "erro";

type Props = {
  rotulo: string;
  tom?: Tom;
};

/** Etiqueta pequena (ex.: "Esgotado", "Online"). */
export default function Selo({ rotulo, tom = "neutro" }: Props) {
  const cores = {
    neutro: { fundo: COLORS.surfaceSecondary, texto: COLORS.textSecondary },
    sucesso: { fundo: COLORS.successBackground, texto: COLORS.success },
    aviso: { fundo: COLORS.warningBackground, texto: COLORS.warning },
    erro: { fundo: COLORS.dangerBackground, texto: COLORS.danger },
  }[tom];

  return (
    <View style={[styles.selo, { backgroundColor: cores.fundo }]}>
      <Text style={[styles.texto, { color: cores.texto }]} numberOfLines={1}>
        {rotulo}
      </Text>
    </View>
  );
}

/** Selo que resume a situação do evento; não mostra nada quando está tudo normal. */
export function SeloDisponibilidade({
  evento,
  disponibilidade,
}: {
  evento: Evento;
  disponibilidade: Disponibilidade;
}) {
  if (disponibilidade === "aberto") {
    if (evento.vagasRestantes > 0 && evento.vagasRestantes <= 10) {
      const n = evento.vagasRestantes;
      return <Selo tom="aviso" rotulo={n === 1 ? "Última vaga" : `Últimas ${n} vagas`} />;
    }
    return null;
  }

  const tom: Tom =
    disponibilidade === "cancelado"
      ? "erro"
      : disponibilidade === "encerrado"
      ? "neutro"
      : "aviso";

  return <Selo tom={tom} rotulo={ROTULO_DISPONIBILIDADE[disponibilidade]} />;
}

const styles = criarEstilos(() => ({
  selo: {
    height: 24,
    paddingHorizontal: 9,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  texto: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
}));
