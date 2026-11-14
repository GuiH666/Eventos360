import React, { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import BannerAviso from "../../src/components/BannerAviso";
import EventoCard from "../../src/components/EventoCard";
import FiltrosEventos from "../../src/components/FiltrosEventos";
import ProximoEvento from "../../src/components/ProximoEvento";
import EmptyState from "../../src/components/ui/EmptyState";
import ErrorState from "../../src/components/ui/ErrorState";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { SkeletonLista } from "../../src/components/ui/Skeleton";
import { useToast } from "../../src/components/ui/Toast";
import { mensagemDoErro } from "../../src/services/apiEventos";
import { useEventos } from "../../src/state/EventosContext";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { GUTTER } from "../../src/theme/tokens";
import { Evento } from "../../src/types/Evento";
import { dataHoraCompacta, saudacao } from "../../src/utils/datas";
import { disponibilidadeDoEvento, ehFuturo } from "../../src/utils/disponibilidade";
import {
  FILTROS_INICIAIS,
  Filtros,
  filtrarEventos,
  temFiltroAtivo,
} from "../../src/utils/filtros";
import { avisos } from "../../src/utils/avisos";

/**
 * Tela principal: lista de eventos (FlatList) com busca e filtros.
 *
 * Os dados vêm do EventosProvider (API REST + cópia local). Esta tela só
 * decide o que mostrar em cada estado:
 *   carregando -> esqueleto | erro -> tela de erro | ok sem eventos -> vazio
 *   ok com eventos -> lista (com aviso se estiver usando a cópia salva)
 */
export default function EventosScreen() {
  const router = useRouter();
  const { toast, mostrar } = useToast(24);

  const {
    status,
    eventos,
    origem,
    sincronizadoEm,
    erro,
    atualizando,
    agora,
    recarregar,
    ehFavorito,
    alternarFavorito,
  } = useEventos();

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);

  /* Recados deixados por outras telas ("Inscrição confirmada") */
  useFocusEffect(
    useCallback(() => {
      const aviso = avisos.consumir();
      if (aviso) mostrar(aviso);
    }, [mostrar])
  );

  const visiveis = useMemo(
    () => filtrarEventos(eventos, filtros, agora),
    [eventos, filtros, agora]
  );

  const proximos = useMemo(
    () => eventos.filter((e) => ehFuturo(e, agora)).length,
    [eventos, agora]
  );

  /* O destaque do topo: o primeiro evento que ainda aceita inscrição */
  const destaque = useMemo(
    () =>
      filtrarEventos(eventos, FILTROS_INICIAIS, agora).find(
        (e) => disponibilidadeDoEvento(e, agora) === "aberto"
      ),
    [eventos, agora]
  );

  const abrir = useCallback(
    (evento: Evento) => {
      router.push({ pathname: "/evento/[id]", params: { id: evento.id } });
    },
    [router]
  );

  const favoritar = useCallback(
    async (evento: Evento) => {
      try {
        mostrar(await alternarFavorito(evento));
      } catch {
        mostrar("Não foi possível atualizar os favoritos", "erro");
      }
    },
    [alternarFavorito, mostrar]
  );

  const renderItem = useCallback(
    ({ item }: { item: Evento }) => (
      <View style={styles.item}>
        <EventoCard
          evento={item}
          agora={agora}
          favorito={ehFavorito(item.id)}
          onAbrir={abrir}
          onFavoritar={favoritar}
        />
      </View>
    ),
    [agora, ehFavorito, abrir, favoritar]
  );

  /* ---------- Avisos no topo da lista ---------- */

  const aviso =
    origem === "cache" && erro ? (
      <BannerAviso
        icone="cloud-offline-outline"
        texto={`${mensagemDoErro(erro)} Mostrando os eventos salvos em ${
          sincronizadoEm ? dataHoraCompacta(sincronizadoEm) : "uma visita anterior"
        }.`}
        acao="Tentar de novo"
        onAcao={recarregar}
      />
    ) : origem === "cache" && atualizando ? (
      <BannerAviso icone="sync-outline" tom="info" texto="Atualizando a lista de eventos…" />
    ) : erro && origem === "api" ? (
      <BannerAviso
        icone="cloud-offline-outline"
        texto="Não foi possível atualizar agora. Puxe a lista para baixo para tentar de novo."
      />
    ) : null;

  const cabecalho = (
    <View>
      <ScreenHeader
        acima={saudacao(agora)}
        titulo="Eventos"
        subtitulo={
          status === "ok"
            ? `${proximos} ${proximos === 1 ? "evento" : "eventos"} pela frente`
            : "Palestras, oficinas, hackathons e mais"
        }
      />
      {aviso}
      {status === "ok" && destaque && !temFiltroAtivo(filtros) ? (
        <ProximoEvento evento={destaque} agora={agora} onAbrir={abrir} />
      ) : null}
      {status === "ok" && eventos.length > 0 ? (
        <FiltrosEventos filtros={filtros} onMudar={setFiltros} />
      ) : null}
    </View>
  );

  /* ---------- Estados da tela ---------- */

  if (status === "carregando") {
    return (
      <View style={styles.tela}>
        {cabecalho}
        <View style={styles.item}>
          <SkeletonLista quantidade={4} />
        </View>
      </View>
    );
  }

  if (status === "erro") {
    return (
      <View style={styles.tela}>
        {cabecalho}
        <ErrorState
          titulo="Sem conexão com a API"
          texto={`${mensagemDoErro(erro)} Ainda não há eventos salvos neste aparelho.`}
          onTentar={recarregar}
        />
      </View>
    );
  }

  return (
    <View style={styles.tela}>
      <FlatList
        data={eventos.length === 0 ? [] : visiveis}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        ListHeaderComponent={cabecalho}
        ItemSeparatorComponent={Separador}
        ListEmptyComponent={
          eventos.length === 0 ? (
            <EmptyState
              icone="calendar-outline"
              titulo="Nenhum evento publicado"
              texto="A API não retornou eventos no momento. Volte mais tarde ou atualize a lista."
              acao="Atualizar"
              onAcao={recarregar}
            />
          ) : (
            <EmptyState
              icone="search-outline"
              titulo="Nenhum evento encontrado"
              texto={
                temFiltroAtivo(filtros)
                  ? "Nada combina com a busca e os filtros escolhidos. Tente outros termos."
                  : "Não há eventos futuros no momento."
              }
              acao={temFiltroAtivo(filtros) ? "Limpar filtros" : undefined}
              onAcao={() => setFiltros(FILTROS_INICIAIS)}
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={recarregar}
            tintColor={COLORS.primaryLight}
            colors={[COLORS.primaryLight]}
            progressBackgroundColor={COLORS.surface}
          />
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={8}
        windowSize={7}
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
}));
