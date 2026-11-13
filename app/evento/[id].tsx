import React, { useCallback, useState } from "react";
import { Platform, ScrollView, Share, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Selo, { SeloDisponibilidade } from "../../src/components/Selo";
import EmptyState from "../../src/components/ui/EmptyState";
import PressableScale from "../../src/components/ui/PressableScale";
import { useToast } from "../../src/components/ui/Toast";
import { buscarInscricoesDoEvento } from "../../src/services/inscricoesService";
import { momentoDoLembrete } from "../../src/services/lembretes";
import { useEventos } from "../../src/state/EventosContext";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { glow, GUTTER, TYPE } from "../../src/theme/tokens";
import { Evento, Inscricao } from "../../src/types/Evento";
import { ICONE_MODALIDADE, visualDaCategoria } from "../../src/utils/categorias";
import {
  dataHoraCurta,
  dataPorExtenso,
  hora,
  periodo,
  rotuloRelativo,
} from "../../src/utils/datas";
import {
  EXPLICACAO_DISPONIBILIDADE,
  aceitaInscricao,
  disponibilidadeDoEvento,
} from "../../src/utils/disponibilidade";
import { formatarMoeda } from "../../src/utils/format";
import { haptics } from "../../src/utils/haptics";
import { ROTULO_COMPARTILHAR } from "../../src/utils/plataforma";
import { avisos } from "../../src/utils/avisos";

/** Detalhes do evento: informações, favorito/lembrete, compartilhar e inscrição. */
export default function EventoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, mostrar } = useToast(110);

  const { buscarEvento, favoritos, ehFavorito, alternarFavorito, alternarLembrete, agora, status } =
    useEventos();

  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);

  const evento: Evento | undefined =
    buscarEvento(String(id)) ?? favoritos.find((f) => f.eventoId === id)?.dados;

  /* Relê as inscrições ao voltar do formulário */
  useFocusEffect(
    useCallback(() => {
      try {
        setInscricoes(buscarInscricoesDoEvento(String(id)));
      } catch {
        setInscricoes([]);
      }

      const aviso = avisos.consumir();
      if (aviso) mostrar(aviso);
    }, [id, mostrar])
  );

  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  /* ---------- Evento não encontrado ---------- */
  if (!evento) {
    return (
      <View style={[styles.tela, { paddingTop: insets.top + 12 }]}>
        <BotaoRedondo icone="arrow-back" rotulo="Voltar" onPress={voltar} />
        <EmptyState
          icone="calendar-clear-outline"
          titulo={status === "carregando" ? "Carregando evento…" : "Evento indisponível"}
          texto="Não encontramos este evento. Ele pode ter sido removido pelo organizador."
          acao="Ver todos os eventos"
          onAcao={() => router.replace("/")}
        />
      </View>
    );
  }

  const disp = disponibilidadeDoEvento(evento, agora);
  const visual = visualDaCategoria(evento.categoria);
  const favorito = ehFavorito(evento.id);
  const fav = favoritos.find((f) => f.eventoId === evento.id);
  const podeInscrever = aceitaInscricao(disp);
  const jaInscrito = inscricoes.find((i) => i.tipo === "inscricao");
  const jaInteressado = inscricoes.find((i) => i.tipo === "interesse");
  const ocupadas = evento.vagas - evento.vagasRestantes;
  const pct = evento.vagas > 0 ? Math.min(1, ocupadas / evento.vagas) : 0;
  const podeLembrar = favorito && (disp === "aberto" || disp === "esgotado" || disp === "inscricoes_encerradas");

  async function favoritar() {
    try {
      if (favorito) haptics.toque();
      else haptics.medio();
      mostrar(await alternarFavorito(evento as Evento));
    } catch {
      mostrar("Não foi possível atualizar os favoritos", "erro");
    }
  }

  async function compartilhar() {
    const e = evento as Evento;
    const mensagem = `${e.titulo}\n${periodo(e.inicio, e.fim)}\n${e.local}${
      e.link && Platform.OS !== "ios" ? `\n${e.link}` : ""
    }`;

    try {
      // No iOS o link vai no campo "url" (o sistema o trata como link de verdade).
      await Share.share(
        Platform.select({
          ios: { message: mensagem, url: e.link },
          default: { message: mensagem },
        }) as { message: string; url?: string }
      );
    } catch {
      mostrar("Não foi possível compartilhar", "erro");
    }
  }

  function abrirInscricao() {
    haptics.medio();
    router.push({ pathname: "/inscricao/[id]", params: { id: evento!.id } });
  }

  return (
    <View style={styles.tela}>
      {/* A faixa do topo é clara no tema escuro e escura no claro: os ícones da barra de status precisam do contrário */}
      <StatusBar style={COLORS.esquema === "escuro" ? "dark" : "light"} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.conteudo}>
        {/* ---------- Faixa colorida do topo ---------- */}
        <View style={[styles.hero, { backgroundColor: visual.fundo, paddingTop: insets.top + 12 }]}>
          <View style={styles.barra}>
            <BotaoRedondo icone="arrow-back" rotulo="Voltar" onPress={voltar} />
            <View style={styles.barraDireita}>
              <BotaoRedondo icone="share-outline" rotulo={ROTULO_COMPARTILHAR} onPress={compartilhar} />
              <BotaoRedondo
                icone={favorito ? "heart" : "heart-outline"}
                rotulo={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                onPress={favoritar}
                cor={favorito ? COLORS.danger : undefined}
              />
            </View>
          </View>

          <View style={styles.categoria}>
            <Ionicons name={visual.icone} size={16} color={visual.texto} />
            <Text style={[styles.categoriaTexto, { color: visual.texto }]}>
              {evento.categoria}
            </Text>
          </View>

          <Text style={[styles.titulo, { color: visual.texto }]} accessibilityRole="header">
            {evento.titulo}
          </Text>
          <Text style={[styles.organizador, { color: visual.texto }]}>
            por {evento.organizador}
          </Text>
        </View>

        <View style={styles.corpo}>
          {/* ---------- Selos ---------- */}
          <View style={styles.selos}>
            <Selo rotulo={evento.modalidade} />
            <Selo
              tom={evento.gratuito ? "sucesso" : "neutro"}
              rotulo={evento.gratuito ? "Gratuito" : formatarMoeda(evento.preco)}
            />
            <SeloDisponibilidade evento={evento} disponibilidade={disp} />
          </View>

          {/* ---------- Aviso quando não dá para se inscrever ---------- */}
          {!podeInscrever ? (
            <View
              style={[
                styles.aviso,
                {
                  backgroundColor:
                    disp === "cancelado" ? COLORS.dangerBackground : COLORS.warningBackground,
                },
              ]}
              accessibilityRole="alert"
            >
              <Ionicons
                name={disp === "cancelado" ? "close-circle-outline" : "information-circle-outline"}
                size={20}
                color={disp === "cancelado" ? COLORS.danger : COLORS.warning}
              />
              <Text style={styles.avisoTexto}>{EXPLICACAO_DISPONIBILIDADE[disp]}</Text>
            </View>
          ) : null}

          {/* ---------- Situação do usuário ---------- */}
          {jaInscrito || jaInteressado ? (
            <View style={[styles.aviso, { backgroundColor: COLORS.successBackground }]}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={styles.avisoTexto}>
                {jaInscrito
                  ? `Você está inscrito como ${jaInscrito.nome}.`
                  : `Você registrou interesse como ${jaInteressado!.nome}.`}
              </Text>
            </View>
          ) : null}

          {/* ---------- Informações ---------- */}
          <View style={styles.cartao}>
            <Info
              icone="calendar-outline"
              titulo={dataPorExtenso(evento.inicio)}
              texto={`${periodo(evento.inicio, evento.fim)} · ${rotuloRelativo(evento.inicio, agora)}`}
            />
            <Info
              icone={ICONE_MODALIDADE[evento.modalidade]}
              titulo={evento.local}
              texto={evento.modalidade}
            />
            <Info
              icone="people-outline"
              titulo={
                evento.vagasRestantes > 0
                  ? `${evento.vagasRestantes} de ${evento.vagas} vagas disponíveis`
                  : `Vagas esgotadas (${evento.vagas})`
              }
              texto={
                evento.inscricoesAte
                  ? `Inscrições até ${dataHoraCurta(evento.inscricoesAte)}`
                  : "Sem prazo de inscrição definido"
              }
            >
              <View style={styles.trilha}>
                <View
                  style={[
                    styles.preenchido,
                    {
                      width: `${Math.round(pct * 100)}%`,
                      backgroundColor: pct >= 0.9 ? COLORS.warning : COLORS.primaryLight,
                    },
                  ]}
                />
              </View>
            </Info>
          </View>

          {/* ---------- Lembrete (só para favoritos) ---------- */}
          {podeLembrar ? (
            <PressableScale
              onPress={async () => mostrar(await alternarLembrete(evento))}
              accessibilityRole="switch"
              accessibilityState={{ checked: !!fav?.notificacaoId }}
              accessibilityLabel="Lembrete deste evento"
              style={styles.lembrete}
            >
              <Ionicons
                name={fav?.notificacaoId ? "notifications" : "notifications-off-outline"}
                size={22}
                color={fav?.notificacaoId ? COLORS.primaryLight : COLORS.textMuted}
              />
              <View style={styles.lembreteTextos}>
                <Text style={styles.lembreteTitulo}>
                  {fav?.notificacaoId ? "Lembrete ligado" : "Lembrete desligado"}
                </Text>
                <Text style={styles.lembreteDetalhe}>
                  {fav?.notificacaoId
                    ? `Você será avisado ${dataHoraCurta(momentoDoLembrete(evento))}`
                    : "Toque para ser avisado antes de começar"}
                </Text>
              </View>
            </PressableScale>
          ) : null}

          {/* ---------- Sobre ---------- */}
          <Text style={styles.secao}>Sobre o evento</Text>
          <Text style={styles.descricao}>{evento.descricao || "Sem descrição."}</Text>

          {evento.tags.length > 0 ? (
            <View style={styles.selos}>
              {evento.tags.map((t) => (
                <Selo key={t} rotulo={`#${t}`} />
              ))}
            </View>
          ) : null}

          <Text style={styles.horario}>
            Começa às {hora(evento.inicio)} e termina às {hora(evento.fim)}.
          </Text>
        </View>
      </ScrollView>

      {/* ---------- Botão de inscrição fixo embaixo ---------- */}
      <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PressableScale
          onPress={abrirInscricao}
          disabled={!podeInscrever}
          accessibilityRole="button"
          accessibilityState={{ disabled: !podeInscrever }}
          accessibilityLabel={podeInscrever ? "Quero me inscrever" : "Inscrição indisponível"}
          style={[styles.botaoPrincipal, podeInscrever ? glow() : styles.botaoDesativado]}
        >
          <Ionicons
            name={podeInscrever ? "ticket-outline" : "lock-closed-outline"}
            size={20}
            color={podeInscrever ? COLORS.onPrimary : COLORS.textMuted}
          />
          <Text
            style={[styles.botaoTexto, !podeInscrever && { color: COLORS.textMuted }]}
          >
            {podeInscrever
              ? jaInscrito || jaInteressado
                ? "Inscrever outra pessoa"
                : "Quero me inscrever"
              : disp === "encerrado"
              ? "Evento encerrado"
              : disp === "cancelado"
              ? "Evento cancelado"
              : disp === "esgotado"
              ? "Vagas esgotadas"
              : "Inscrições encerradas"}
          </Text>
        </PressableScale>
      </View>

      {toast}
    </View>
  );
}

/* ---------- Pecinhas locais ---------- */

function BotaoRedondo({
  icone,
  rotulo,
  onPress,
  cor,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  onPress: () => void;
  cor?: string;
}) {
  return (
    <PressableScale
      escala={0.9}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={styles.redondo}
    >
      <Ionicons name={icone} size={22} color={cor ?? "#0B0B0E"} />
    </PressableScale>
  );
}

function Info({
  icone,
  titulo,
  texto,
  children,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.info}>
      <View style={styles.infoIcone}>
        <Ionicons name={icone} size={20} color={COLORS.text} />
      </View>
      <View style={styles.infoTextos}>
        <Text style={styles.infoTitulo}>{titulo}</Text>
        <Text style={styles.infoTexto}>{texto}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = criarEstilos(() => ({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 0,
  },

  conteudo: {
    paddingBottom: 130,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },

  hero: {
    paddingHorizontal: GUTTER,
    paddingBottom: 28,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    gap: 8,
  },

  barra: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  barraDireita: {
    flexDirection: "row",
    gap: 10,
  },

  redondo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
  },

  categoria: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  categoriaTexto: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  titulo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.2,
    lineHeight: 36,
  },

  organizador: {
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.75,
  },

  corpo: {
    paddingHorizontal: GUTTER,
    paddingTop: 18,
    gap: 14,
  },

  selos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 18,
  },

  avisoTexto: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },

  cartao: {
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    gap: 16,
  },

  info: {
    flexDirection: "row",
    gap: 14,
  },

  infoIcone: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },

  infoTextos: {
    flex: 1,
    gap: 2,
  },

  infoTitulo: {
    ...TYPE.bodyStrong,
    fontSize: 15,
  },

  infoTexto: {
    ...TYPE.caption,
  },

  trilha: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceSecondary,
    marginTop: 8,
    overflow: "hidden",
  },

  preenchido: {
    height: "100%",
    borderRadius: 4,
  },

  lembrete: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  lembreteTextos: {
    flex: 1,
    gap: 2,
  },

  lembreteTitulo: {
    ...TYPE.bodyStrong,
    fontSize: 15,
  },

  lembreteDetalhe: {
    ...TYPE.caption,
  },

  secao: {
    ...TYPE.heading,
    marginTop: 6,
  },

  descricao: {
    ...TYPE.body,
    fontSize: 16,
    lineHeight: 24,
  },

  horario: {
    ...TYPE.caption,
  },

  rodape: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.borderSoft,
    alignItems: "center",
  },

  botaoPrincipal: {
    width: "100%",
    maxWidth: 640,
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
  },

  botaoDesativado: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  botaoTexto: {
    color: COLORS.onPrimary,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
}));
