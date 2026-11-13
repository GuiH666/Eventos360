import React, { useCallback, useMemo } from "react";
import { FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import EventoCard from "../../src/components/EventoCard";
import PressableScale from "../../src/components/ui/PressableScale";
import EmptyState from "../../src/components/ui/EmptyState";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { useToast } from "../../src/components/ui/Toast";
import { momentoDoLembrete } from "../../src/services/lembretes";
import { useEventos } from "../../src/state/EventosContext";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { GUTTER, TYPE } from "../../src/theme/tokens";
import { Evento, Favorito } from "../../src/types/Evento";
import { dataHoraCurta, paraData } from "../../src/utils/datas";
import { ehFuturo } from "../../src/utils/disponibilidade";
import { haptics } from "../../src/utils/haptics";

type Item = {
  favorito: Favorito;
  evento: Evento;
  /** O evento sumiu da lista oficial da API (usamos a cópia salva) */
  removidoDaApi: boolean;
};

/**
 * Favoritos: lê do SQLite (via contexto), então funciona sem internet.
 * Se a API trouxe dados novos do evento, mostra os novos; senão usa a cópia.
 */
export default function FavoritosScreen() {
  const router = useRouter();
  const { toast, mostrar } = useToast(24);

  const {
    favoritos,
    buscarEvento,
    alternarFavorito,
    alternarLembrete,
    agora,
    origem,
    status,
  } = useEventos();

  const itens = useMemo<Item[]>(() => {
    const lista = favoritos.map((favorito) => {
      const atual = buscarEvento(favorito.eventoId);
      return {
        favorito,
        evento: atual ?? favorito.dados,
        removidoDaApi: !atual && status === "ok" && origem === "api",
      };
    });

    // próximos primeiro (do mais perto ao mais longe); encerrados no fim
    return lista.sort((a, b) => {
      const fa = ehFuturo(a.evento, agora) ? 0 : 1;
      const fb = ehFuturo(b.evento, agora) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      const ta = paraData(a.evento.inicio).getTime();
      const tb = paraData(b.evento.inicio).getTime();
      return fa === 0 ? ta - tb : tb - ta;
    });
  }, [favoritos, buscarEvento, agora, status, origem]);

  const remover = useCallback(
    async (evento: Evento) => {
      haptics.toque();
      mostrar(await alternarFavorito(evento));
    },
    [alternarFavorito, mostrar]
  );

  const abrir = useCallback(
    (evento: Evento) => {
      router.push({ pathname: "/evento/[id]", params: { id: evento.id } });
    },
    [router]
  );

  const trocarLembrete = useCallback(
    async (evento: Evento) => {
      mostrar(await alternarLembrete(evento));
    },
    [alternarLembrete, mostrar]
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      const { favorito, evento, removidoDaApi } = item;
      const podeLembrar = ehFuturo(evento, agora) && evento.situacao !== "cancelado";
      const ligado = favorito.notificacaoId !== null;

      return (
        <View style={styles.item}>
          <EventoCard
            evento={evento}
            agora={agora}
            favorito
            onAbrir={abrir}
            onFavoritar={remover}
          />

          {removidoDaApi ? (
            <View style={styles.aviso}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.warning} />
              <Text style={styles.avisoTexto}>
                Este evento saiu da lista oficial. Mostrando a cópia salva no aparelho.
              </Text>
            </View>
          ) : null}

          {podeLembrar ? (
            <PressableScale
              onPress={() => trocarLembrete(evento)}
              accessibilityRole="switch"
              accessibilityState={{ checked: ligado }}
              accessibilityLabel={ligado ? "Desligar lembrete" : "Ligar lembrete"}
              style={[styles.lembrete, ligado && styles.lembreteLigado]}
            >
              <Ionicons
                name={ligado ? "notifications" : "notifications-off-outline"}
                size={16}
                color={ligado ? COLORS.onPrimary : COLORS.textSecondary}
              />
              <Text style={[styles.lembreteTexto, ligado && styles.lembreteTextoLigado]}>
                {ligado
                  ? `Lembrete ${dataHoraCurta(momentoDoLembrete(evento))}`
                  : "Lembrete desligado · toque para ligar"}
              </Text>
            </PressableScale>
          ) : null}
        </View>
      );
    },
    [agora, abrir, remover, trocarLembrete]
  );

  return (
    <View style={styles.tela}>
      <FlatList
        data={itens}
        keyExtractor={(i) => i.favorito.eventoId}
        renderItem={renderItem}
        ListHeaderComponent={
          <ScreenHeader
            titulo="Favoritos"
            subtitulo={
              itens.length === 0
                ? "Seus eventos salvos aparecem aqui"
                : `${itens.length} ${itens.length === 1 ? "evento salvo" : "eventos salvos"}`
            }
          />
        }
        ListEmptyComponent={
          <EmptyState
            icone="heart-outline"
            titulo="Nenhum favorito ainda"
            texto="Toque no coração de um evento para guardá-lo aqui e receber um lembrete antes de ele começar."
            acao="Ver eventos"
            onAcao={() => router.navigate("/")}
          />
        }
        ItemSeparatorComponent={Separador}
        contentContainerStyle={styles.conteudo}
      />
      {toast}
    </View>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = criarEstilos(() => ({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  conteudo: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingBottom: 140,
  },

  item: {
    paddingHorizontal: GUTTER,
    gap: 8,
  },

  separador: {
    height: 16,
  },

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 6,
  },

  avisoTexto: {
    ...TYPE.caption,
    flex: 1,
    color: COLORS.warning,
  },

  lembrete: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  lembreteLigado: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  lembreteTexto: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },

  lembreteTextoLigado: {
    color: COLORS.onPrimary,
  },
}));
