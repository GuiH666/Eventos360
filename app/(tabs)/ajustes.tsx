import React, { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Linking,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";

import Selo from "../../src/components/Selo";
import Chip from "../../src/components/ui/Chip";
import PressableScale from "../../src/components/ui/PressableScale";
import ScreenHeader from "../../src/components/ui/ScreenHeader";
import { useToast } from "../../src/components/ui/Toast";
import { API_EVENTOS } from "../../src/config";
import {
  SituacaoPermissao,
  agendarTeste,
  consultarPermissao,
  garantirPermissao,
} from "../../src/services/lembretes";
import {
  ANTECEDENCIAS,
  Antecedencia,
  lerAntecedencia,
  lerLembrarAoFavoritar,
  salvarAntecedencia,
  salvarLembrarAoFavoritar,
} from "../../src/services/preferencias";
import { useEventos } from "../../src/state/EventosContext";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { GUTTER, TYPE } from "../../src/theme/tokens";
import { Preferencia } from "../../src/theme/tema";
import { useTema } from "../../src/theme/TemaProvider";
import { dataHoraCompacta } from "../../src/utils/datas";
import { haptics } from "../../src/utils/haptics";
import {
  AVISO_PRECISAO_LEMBRETE,
  CAMINHO_AJUSTES_NOTIFICACAO,
} from "../../src/utils/plataforma";

const TEMAS: { valor: Preferencia; rotulo: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  { valor: "sistema", rotulo: "Automático", icone: "contrast-outline" },
  { valor: "claro", rotulo: "Claro", icone: "sunny-outline" },
  { valor: "escuro", rotulo: "Escuro", icone: "moon-outline" },
];

/** Ajustes: tema, lembretes (permissão incluída), dados da API e sobre o app. */
export default function AjustesScreen() {
  const { toast, mostrar } = useToast(24);
  const { preferencia, escolher } = useTema();
  const { origem, sincronizadoEm, eventos, atualizando, recarregar, reagendarLembretes, favoritos } =
    useEventos();

  const [antecedencia, setAntecedencia] = useState<Antecedencia>(() => lerAntecedencia());
  const [lembrarAoFavoritar, setLembrarAoFavoritar] = useState(() => lerLembrarAoFavoritar());
  const [permissao, setPermissao] = useState<SituacaoPermissao | null>(null);

  const atualizarPermissao = useCallback(() => {
    consultarPermissao()
      .then(setPermissao)
      .catch(() => setPermissao(null));
  }, []);

  /* Confere a permissão ao abrir a aba e ao voltar das configurações do sistema */
  useFocusEffect(
    useCallback(() => {
      atualizarPermissao();
    }, [atualizarPermissao])
  );

  useEffect(() => {
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") atualizarPermissao();
    });
    return () => assinatura.remove();
  }, [atualizarPermissao]);

  async function trocarAntecedencia(valor: Antecedencia) {
    setAntecedencia(valor);
    salvarAntecedencia(valor);
    const total = await reagendarLembretes();
    mostrar(
      favoritos.length === 0
        ? "Antecedência salva"
        : `${total} ${total === 1 ? "lembrete refeito" : "lembretes refeitos"}`
    );
  }

  async function pedirPermissao() {
    setPermissao(await garantirPermissao());
  }

  async function testarNotificacao() {
    const r = await agendarTeste(5);
    if (r.tipo === "agendado") {
      haptics.sucesso();
      mostrar("Teste agendado: aparece em 5 segundos. Pode minimizar o app.");
    } else {
      mostrar("Ative as notificações para testar", "erro");
      atualizarPermissao();
    }
  }

  const versao = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <View style={styles.tela}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader titulo="Ajustes" subtitulo="Aparência, lembretes e dados" />

        {/* ---------- Aparência ---------- */}
        <Secao titulo="Aparência" icone="color-palette-outline">
          <View style={styles.chips}>
            {TEMAS.map((t) => (
              <Chip
                key={t.valor}
                rotulo={t.rotulo}
                icone={t.icone}
                ativo={preferencia === t.valor}
                onPress={() => escolher(t.valor)}
              />
            ))}
          </View>
        </Secao>

        {/* ---------- Lembretes ---------- */}
        <Secao titulo="Lembretes" icone="notifications-outline">
          <View style={styles.linhaSwitch}>
            <View style={styles.textos}>
              <Text style={styles.rotulo}>Lembrar ao favoritar</Text>
              <Text style={styles.ajuda}>
                Agenda um aviso automático sempre que você favoritar um evento.
              </Text>
            </View>
            <Switch
              value={lembrarAoFavoritar}
              onValueChange={(v) => {
                setLembrarAoFavoritar(v);
                salvarLembrarAoFavoritar(v);
              }}
              trackColor={{ false: COLORS.surfaceRaised, true: COLORS.primary }}
              thumbColor={COLORS.white}
              accessibilityLabel="Lembrar ao favoritar"
            />
          </View>

          <Text style={[styles.rotulo, styles.espaco]}>Avisar com antecedência de</Text>
          <View style={styles.chips}>
            {ANTECEDENCIAS.map((a) => (
              <Chip
                key={a.valor}
                rotulo={a.rotulo}
                ativo={antecedencia === a.valor}
                onPress={() => trocarAntecedencia(a.valor)}
              />
            ))}
          </View>

          <View style={[styles.linhaSwitch, styles.espaco]}>
            <View style={styles.textos}>
              <Text style={styles.rotulo}>Permissão de notificações</Text>
              <Text style={styles.ajuda}>
                {permissao === "bloqueada"
                  ? CAMINHO_AJUSTES_NOTIFICACAO
                  : "Necessária para o aparelho avisar você antes dos eventos."}
              </Text>
            </View>
            <Selo
              tom={permissao === "concedida" ? "sucesso" : "aviso"}
              rotulo={
                permissao === "concedida"
                  ? "Ativa"
                  : permissao === "bloqueada"
                  ? "Bloqueada"
                  : permissao === "negada"
                  ? "Pendente"
                  : "…"
              }
            />
          </View>

          {permissao === "negada" ? (
            <Botao rotulo="Permitir notificações" icone="notifications" onPress={pedirPermissao} />
          ) : null}
          {permissao === "bloqueada" ? (
            <Botao
              rotulo="Abrir configurações do app"
              icone="settings-outline"
              onPress={() => Linking.openSettings()}
            />
          ) : null}

          <Botao
            rotulo="Enviar notificação de teste"
            icone="paper-plane-outline"
            secundario
            onPress={testarNotificacao}
          />

          {AVISO_PRECISAO_LEMBRETE ? (
            <Text style={[styles.ajuda, styles.espaco]}>{AVISO_PRECISAO_LEMBRETE}</Text>
          ) : null}
        </Secao>

        {/* ---------- Dados ---------- */}
        <Secao titulo="Dados dos eventos" icone="cloud-download-outline">
          <Linha rotulo="Origem" valor={origem === "api" ? "API (online)" : origem === "cache" ? "Cópia salva" : "—"} />
          <Linha
            rotulo="Última atualização"
            valor={sincronizadoEm ? dataHoraCompacta(sincronizadoEm) : "—"}
          />
          <Linha rotulo="Eventos carregados" valor={String(eventos.length)} />
          <Text style={[styles.ajuda, styles.espaco]} selectable>
            {API_EVENTOS}
          </Text>

          <Botao
            rotulo={atualizando ? "Atualizando…" : "Atualizar agora"}
            icone="refresh"
            secundario
            onPress={async () => {
              await recarregar();
              mostrar("Verificação concluída");
            }}
          />
        </Secao>

        {/* ---------- Sobre ---------- */}
        <Secao titulo="Sobre" icone="information-circle-outline">
          <Linha rotulo="Aplicativo" valor="Eventos 360" />
          <Linha rotulo="Versão" valor={versao} />
          <Linha rotulo="Projeto" valor="A2 · Grupo 8" />
        </Secao>
      </ScrollView>
      {toast}
    </View>
  );
}

/* ---------- Pecinhas locais da tela ---------- */

function Secao({
  titulo,
  icone,
  children,
}: {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.secao}>
      <View style={styles.tituloSecao}>
        <Ionicons name={icone} size={18} color={COLORS.textSecondary} />
        <Text style={styles.tituloTexto}>{titulo}</Text>
      </View>
      {children}
    </View>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.ajuda}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

function Botao({
  rotulo,
  icone,
  onPress,
  secundario = false,
}: {
  rotulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  secundario?: boolean;
}) {
  return (
    <PressableScale
      onPress={() => {
        haptics.toque();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={[styles.botao, secundario && styles.botaoSecundario]}
    >
      <Ionicons
        name={icone}
        size={18}
        color={secundario ? COLORS.text : COLORS.onPrimary}
      />
      <Text style={[styles.botaoTexto, secundario && { color: COLORS.text }]}>{rotulo}</Text>
    </PressableScale>
  );
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

  secao: {
    marginHorizontal: GUTTER,
    marginBottom: 16,
    padding: 18,
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  tituloSecao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },

  tituloTexto: {
    ...TYPE.small,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  linhaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  textos: {
    flex: 1,
    gap: 2,
  },

  espaco: {
    marginTop: 8,
  },

  rotulo: {
    ...TYPE.bodyStrong,
    fontSize: 15,
  },

  ajuda: {
    ...TYPE.caption,
    lineHeight: 18,
  },

  linhaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  valor: {
    ...TYPE.bodyStrong,
    fontSize: 14,
    flexShrink: 1,
    textAlign: "right",
  },

  botao: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },

  botaoSecundario: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },

  botaoTexto: {
    color: COLORS.onPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
}));
