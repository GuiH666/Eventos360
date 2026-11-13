import React, { useCallback, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";

import Selo from "../../src/components/Selo";
import EmptyState from "../../src/components/ui/EmptyState";
import ErrorState from "../../src/components/ui/ErrorState";
import PressableScale from "../../src/components/ui/PressableScale";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { SkeletonLista } from "../../src/components/ui/Skeleton";
import { useToast } from "../../src/components/ui/Toast";
import { useCarregar } from "../../src/hooks/useCarregar";
import { listarInscricoes, removerInscricao } from "../../src/services/inscricoesService";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { GUTTER, TYPE } from "../../src/theme/tokens";
import { Inscricao } from "../../src/types/Evento";
import { avisos } from "../../src/utils/avisos";
import { dataHoraCompacta, dataHoraCurta } from "../../src/utils/datas";
import { haptics } from "../../src/utils/haptics";

/** Lista as inscrições e manifestações de interesse salvas no SQLite. */
export default function InscricoesScreen() {
  const router = useRouter();
  const { toast, mostrar } = useToast(24);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const ler = useCallback(() => {
    setInscricoes(listarInscricoes());
  }, []);

  const { status, erro, executar } = useCarregar(ler);

  /* Relê sempre que a aba ganha foco (uma inscrição nova pode ter sido criada) */
  useFocusEffect(
    useCallback(() => {
      executar();
      const aviso = avisos.consumir();
      if (aviso) mostrar(aviso);
    }, [executar, mostrar])
  );

  const cancelar = useCallback(
    (item: Inscricao) => {
    Alert.alert(
      item.tipo === "inscricao" ? "Cancelar inscrição?" : "Remover interesse?",
      `"${item.eventoTitulo}" sairá da sua lista. Você poderá se inscrever de novo depois.`,
      [
        { text: "Manter", style: "cancel" },
        {
          text: "Cancelar",
          style: "destructive",
          onPress: () => {
            try {
              removerInscricao(item.id);
              haptics.sucesso();
              executar();
              mostrar("Registro removido");
            } catch {
              mostrar("Não foi possível remover", "erro");
            }
          },
        },
      ]
    );
    },
    [executar, mostrar]
  );

  const renderItem = useCallback(
    ({ item }: { item: Inscricao }) => (
      <View style={styles.item}>
        <PressableScale
          onPress={() =>
            router.push({ pathname: "/evento/[id]", params: { id: item.eventoId } })
          }
          accessibilityRole="button"
          accessibilityLabel={`${item.eventoTitulo}, abrir detalhes`}
          style={styles.cartao}
        >
          <View style={styles.topo}>
            <Selo
              tom={item.tipo === "inscricao" ? "sucesso" : "neutro"}
              rotulo={item.tipo === "inscricao" ? "Inscrição" : "Interesse"}
            />
            <Text style={styles.registrado}>{dataHoraCompacta(item.criadoEm)}</Text>
          </View>

          <Text style={styles.titulo} numberOfLines={2}>
            {item.eventoTitulo}
          </Text>

          <View style={styles.linha}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.info}>{dataHoraCurta(item.eventoInicio)}</Text>
          </View>
          <View style={styles.linha}>
            <Ionicons name="person-outline" size={15} color={COLORS.textMuted} />
            <Text style={styles.info} numberOfLines={1}>
              {item.nome} · {item.email}
            </Text>
          </View>

          <PressableScale
            onPress={() => cancelar(item)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cancelar este registro"
            style={styles.cancelar}
          >
            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </PressableScale>
        </PressableScale>
      </View>
    ),
    [router, cancelar]
  );

  const cabecalho = (
    <ScreenHeader
      titulo="Inscrições"
      subtitulo={
        status === "ok" && inscricoes.length > 0
          ? `${inscricoes.length} ${inscricoes.length === 1 ? "registro" : "registros"} neste aparelho`
          : "Seus eventos confirmados"
      }
    />
  );

  if (status === "carregando") {
    return (
      <View style={styles.tela}>
        {cabecalho}
        <View style={styles.item}>
          <SkeletonLista quantidade={3} />
        </View>
      </View>
    );
  }

  if (status === "erro") {
    return (
      <View style={styles.tela}>
        {cabecalho}
        <ErrorState
          texto="Não foi possível ler suas inscrições salvas no aparelho."
          detalhe={erro}
          onTentar={executar}
        />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <FlatList
        data={inscricoes}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          <EmptyState
            icone="ticket-outline"
            titulo="Nenhuma inscrição ainda"
            texto="Abra um evento e toque em “Quero me inscrever” para garantir sua vaga ou demonstrar interesse."
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
  },

  separador: {
    height: 12,
  },

  cartao: {
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    gap: 8,
  },

  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  registrado: {
    ...TYPE.small,
  },

  titulo: {
    ...TYPE.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },

  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  info: {
    ...TYPE.caption,
    flexShrink: 1,
  },

  cancelar: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
  },

  cancelarTexto: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "800",
  },
}));
