import React from "react";
import { ScrollView, Text, View } from "react-native";

import Chip from "./ui/Chip";
import CampoBusca from "./CampoBusca";
import { criarEstilos } from "../theme/criarEstilos";
import { COLORS } from "../theme/colors";
import { GUTTER, TYPE } from "../theme/tokens";
import { CATEGORIAS, MODALIDADES } from "../types/Evento";
import { visualDaCategoria, ICONE_MODALIDADE } from "../utils/categorias";
import { Janela, ROTULO_JANELA } from "../utils/datas";
import { Filtros } from "../utils/filtros";

type Props = {
  filtros: Filtros;
  onMudar: (novos: Filtros) => void;
};

const JANELAS: Janela[] = ["qualquer", "7dias", "mes", "proximoMes"];

/**
 * Busca + filtros da lista: categoria, modalidade e data.
 * É um componente "controlado": quem usa guarda o estado e recebe as mudanças.
 */
export default function FiltrosEventos({ filtros, onMudar }: Props) {
  function mudar(parcial: Partial<Filtros>) {
    onMudar({ ...filtros, ...parcial });
  }

  return (
    <View style={styles.container}>
      <CampoBusca
        valor={filtros.busca}
        onMudar={(busca) => mudar({ busca })}
        placeholder="Buscar por nome, tema ou data (20/11)"
      />

      <Text style={styles.titulo}>Categoria</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          rotulo="Todas"
          ativo={filtros.categoria === null}
          onPress={() => mudar({ categoria: null })}
        />
        {CATEGORIAS.map((c) => {
          const visual = visualDaCategoria(c);
          return (
            <Chip
              key={c}
              rotulo={c}
              icone={visual.icone}
              ativo={filtros.categoria === c}
              tom={visual.fundo}
              tomTexto={visual.texto}
              onPress={() => mudar({ categoria: filtros.categoria === c ? null : c })}
            />
          );
        })}
      </ScrollView>

      <Text style={styles.titulo}>Modalidade</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
        keyboardShouldPersistTaps="handled"
      >
        <Chip
          rotulo="Todas"
          ativo={filtros.modalidade === null}
          onPress={() => mudar({ modalidade: null })}
        />
        {MODALIDADES.map((m) => (
          <Chip
            key={m}
            rotulo={m}
            icone={ICONE_MODALIDADE[m]}
            ativo={filtros.modalidade === m}
            onPress={() => mudar({ modalidade: filtros.modalidade === m ? null : m })}
          />
        ))}
      </ScrollView>

      <Text style={styles.titulo}>Data</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.linha}
        keyboardShouldPersistTaps="handled"
      >
        {JANELAS.map((j) => (
          <Chip
            key={j}
            rotulo={ROTULO_JANELA[j]}
            ativo={filtros.janela === j}
            onPress={() => mudar({ janela: j })}
          />
        ))}
        <Chip
          rotulo="Mostrar encerrados"
          icone="archive-outline"
          ativo={filtros.mostrarEncerrados}
          tom={COLORS.surfaceRaised}
          tomTexto={COLORS.text}
          onPress={() => mudar({ mostrarEncerrados: !filtros.mostrarEncerrados })}
        />
      </ScrollView>
    </View>
  );
}

const styles = criarEstilos(() => ({
  container: {
    gap: 8,
    paddingBottom: 14,
  },

  titulo: {
    ...TYPE.small,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 6,
    paddingHorizontal: GUTTER,
  },

  linha: {
    gap: 8,
    paddingHorizontal: GUTTER,
  },
}));
