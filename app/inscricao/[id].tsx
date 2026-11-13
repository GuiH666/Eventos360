import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chip from "../../src/components/ui/Chip";
import EmptyState from "../../src/components/ui/EmptyState";
import Field from "../../src/components/ui/Field";
import PressableScale from "../../src/components/ui/PressableScale";
import { useToast } from "../../src/components/ui/Toast";
import { salvarInscricao } from "../../src/services/inscricoesService";
import { lerContato, salvarContato } from "../../src/services/preferencias";
import { useEventos } from "../../src/state/EventosContext";
import { COLORS } from "../../src/theme/colors";
import { criarEstilos } from "../../src/theme/criarEstilos";
import { glow, GUTTER, TYPE } from "../../src/theme/tokens";
import { TipoInscricao } from "../../src/types/Evento";
import { avisos } from "../../src/utils/avisos";
import { dataHoraCurta } from "../../src/utils/datas";
import { aceitaInscricao, disponibilidadeDoEvento } from "../../src/utils/disponibilidade";
import { haptics } from "../../src/utils/haptics";
import {
  mascararTelefone,
  validarEmail,
  validarNome,
  validarObservacao,
  validarTelefone,
} from "../../src/utils/validacao";

type Valores = {
  tipo: TipoInscricao;
  nome: string;
  email: string;
  telefone: string;
  curso: string;
  observacao: string;
  aceite: boolean;
};

type Erros = Partial<Record<keyof Valores, string>>;

/**
 * Regras do formulário. É uma função pura: recebe os valores e devolve os
 * erros, por isso a tela só precisa decidir QUANDO mostrá-los.
 *  - nome: nome e sobrenome, só letras;
 *  - e-mail: formato válido;
 *  - telefone: opcional, mas se vier precisa de DDD + número;
 *  - curso: obrigatório para inscrição, opcional para "tenho interesse";
 *  - termo: precisa ser aceito.
 */
function validar(v: Valores): Erros {
  const erros: Erros = {};

  const nome = validarNome(v.nome);
  if (nome) erros.nome = nome;

  const email = validarEmail(v.email);
  if (email) erros.email = email;

  const telefone = validarTelefone(v.telefone);
  if (telefone) erros.telefone = telefone;

  if (v.tipo === "inscricao" && v.curso.trim().length < 2) {
    erros.curso = "Informe seu curso ou instituição.";
  }

  const obs = validarObservacao(v.observacao);
  if (obs) erros.observacao = obs;

  if (!v.aceite) erros.aceite = "Aceite para continuar.";

  return erros;
}

/** Formulário de inscrição / manifestação de interesse (abre como modal). */
export default function InscricaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toast, mostrar } = useToast(24);
  const { buscarEvento, favoritos, agora } = useEventos();

  const evento = buscarEvento(String(id)) ?? favoritos.find((f) => f.eventoId === id)?.dados;

  const [valores, setValores] = useState<Valores>(() => {
    const contato = lerContato(); // preenche com o que a pessoa digitou da última vez
    return { tipo: "inscricao", observacao: "", aceite: false, ...contato };
  });
  const [tocados, setTocados] = useState<Partial<Record<keyof Valores, boolean>>>({});
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const telefoneRef = useRef<TextInput>(null);
  const cursoRef = useRef<TextInput>(null);
  const obsRef = useRef<TextInput>(null);

  const erros = useMemo(() => validar(valores), [valores]);

  /** Mostra o erro de um campo só depois que a pessoa passou por ele (ou tentou enviar). */
  function erroDe(campo: keyof Valores): string | undefined {
    return tentou || tocados[campo] ? erros[campo] : undefined;
  }

  function mudar<K extends keyof Valores>(campo: K, valor: Valores[K]) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
  }

  function tocar(campo: keyof Valores) {
    setTocados((atual) => ({ ...atual, [campo]: true }));
  }

  function fechar() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  function enviar() {
    if (!evento || salvando) return;
    setTentou(true);

    if (Object.keys(erros).length > 0) {
      haptics.erro();
      mostrar("Corrija os campos destacados", "erro");
      return;
    }

    setSalvando(true);
    try {
      salvarInscricao({
        eventoId: evento.id,
        eventoTitulo: evento.titulo,
        eventoInicio: evento.inicio,
        tipo: valores.tipo,
        nome: valores.nome,
        email: valores.email,
        telefone: valores.telefone,
        curso: valores.curso,
        observacao: valores.observacao,
      });

      salvarContato({
        nome: valores.nome.trim(),
        email: valores.email.trim(),
        telefone: valores.telefone,
        curso: valores.curso.trim(),
      });

      haptics.sucesso();
      avisos.definir(
        valores.tipo === "inscricao" ? "Inscrição confirmada" : "Interesse registrado"
      );
      fechar();
    } catch (e: any) {
      haptics.erro();
      setSalvando(false);
      mostrar(e?.message ?? "Não foi possível salvar. Tente novamente.", "erro");
    }
  }

  /* ---------- Evento indisponível ---------- */
  if (!evento || !aceitaInscricao(disponibilidadeDoEvento(evento, agora))) {
    return (
      <View style={[styles.tela, { paddingTop: insets.top + 12 }]}>
        <EmptyState
          icone="lock-closed-outline"
          titulo="Inscrição indisponível"
          texto={
            evento
              ? "Este evento não está mais aceitando inscrições."
              : "Não encontramos este evento."
          }
          acao="Fechar"
          onAcao={fechar}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      // No iOS o teclado empurra o conteúdo com "padding"; no Android "height" funciona melhor.
      behavior={Platform.select({ ios: "padding", default: "height" })}
    >
      <View style={[styles.cabecalho, { paddingTop: insets.top + 12 }]}>
        <View style={styles.textos}>
          <Text style={styles.acima}>Inscrição</Text>
          <Text style={styles.titulo} numberOfLines={2}>
            {evento.titulo}
          </Text>
          <Text style={styles.data}>{dataHoraCurta(evento.inicio)}</Text>
        </View>

        <PressableScale
          escala={0.9}
          onPress={fechar}
          accessibilityRole="button"
          accessibilityLabel="Fechar formulário"
          style={styles.fechar}
        >
          <Ionicons name="close" size={22} color={COLORS.text} />
        </PressableScale>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.rotuloGrupo}>O que você quer fazer?</Text>
        <View style={styles.chips}>
          <Chip
            rotulo="Quero me inscrever"
            icone="ticket-outline"
            ativo={valores.tipo === "inscricao"}
            onPress={() => mudar("tipo", "inscricao")}
          />
          <Chip
            rotulo="Tenho interesse"
            icone="bookmark-outline"
            ativo={valores.tipo === "interesse"}
            onPress={() => mudar("tipo", "interesse")}
          />
        </View>
        <Text style={styles.ajuda}>
          {valores.tipo === "inscricao"
            ? "Reserva a sua vaga. É preciso informar o curso."
            : "Só avisa o organizador que você tem interesse. Sem compromisso."}
        </Text>

        <View style={styles.campos}>
          <Field
            rotulo="Nome completo"
            value={valores.nome}
            onChangeText={(t) => mudar("nome", t)}
            onBlur={() => tocar("nome")}
            erro={erroDe("nome")}
            placeholder="Ex.: Maria da Silva"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <Field
            ref={emailRef}
            rotulo="E-mail"
            value={valores.email}
            onChangeText={(t) => mudar("email", t)}
            onBlur={() => tocar("email")}
            erro={erroDe("email")}
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => telefoneRef.current?.focus()}
          />

          <Field
            ref={telefoneRef}
            rotulo="Telefone"
            dica="opcional"
            value={valores.telefone}
            onChangeText={(t) => mudar("telefone", mascararTelefone(t))}
            onBlur={() => tocar("telefone")}
            erro={erroDe("telefone")}
            placeholder="(11) 91234-5678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={15}
            returnKeyType="next"
            onSubmitEditing={() => cursoRef.current?.focus()}
          />

          <Field
            ref={cursoRef}
            rotulo="Curso ou instituição"
            dica={valores.tipo === "inscricao" ? undefined : "opcional"}
            value={valores.curso}
            onChangeText={(t) => mudar("curso", t)}
            onBlur={() => tocar("curso")}
            erro={erroDe("curso")}
            placeholder="Ex.: Análise e Desenvolvimento de Sistemas"
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => obsRef.current?.focus()}
          />

          <Field
            ref={obsRef}
            rotulo="Observação"
            dica="opcional"
            direita={<Text style={styles.contador}>{valores.observacao.length}/200</Text>}
            value={valores.observacao}
            onChangeText={(t) => mudar("observacao", t.slice(0, 200))}
            onBlur={() => tocar("observacao")}
            erro={erroDe("observacao")}
            placeholder="Alguma necessidade de acessibilidade, dúvida..."
            linhas={3}
          />
        </View>

        <PressableScale
          onPress={() => {
            haptics.toque();
            mudar("aceite", !valores.aceite);
            tocar("aceite");
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: valores.aceite }}
          accessibilityLabel="Concordo em compartilhar meus dados com o organizador"
          style={styles.aceite}
        >
          <View
            style={[
              styles.caixa,
              valores.aceite && styles.caixaMarcada,
              !!erroDe("aceite") && styles.caixaErro,
            ]}
          >
            {valores.aceite ? <Ionicons name="checkmark" size={18} color={COLORS.onPrimary} /> : null}
          </View>
          <Text style={styles.aceiteTexto}>
            Concordo em compartilhar meus dados com o organizador do evento. Eles ficam salvos
            apenas neste aparelho.
          </Text>
        </PressableScale>
        {erroDe("aceite") ? <Text style={styles.erro}>{erroDe("aceite")}</Text> : null}
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <PressableScale
          onPress={enviar}
          disabled={salvando}
          accessibilityRole="button"
          accessibilityLabel={
            valores.tipo === "inscricao" ? "Confirmar inscrição" : "Registrar interesse"
          }
          style={[styles.botao, glow(), salvando && { opacity: 0.6 }]}
        >
          <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.onPrimary} />
          <Text style={styles.botaoTexto}>
            {valores.tipo === "inscricao" ? "Confirmar inscrição" : "Registrar interesse"}
          </Text>
        </PressableScale>
      </View>

      {toast}
    </KeyboardAvoidingView>
  );
}

const styles = criarEstilos(() => ({
  tela: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  cabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: GUTTER,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.borderSoft,
  },

  textos: {
    flex: 1,
    paddingRight: 12,
    gap: 2,
  },

  acima: {
    ...TYPE.small,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  titulo: {
    ...TYPE.heading,
    fontSize: 24,
    lineHeight: 28,
  },

  data: {
    ...TYPE.caption,
  },

  fechar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  conteudo: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    paddingHorizontal: GUTTER,
    paddingTop: 20,
    paddingBottom: 140,
  },

  rotuloGrupo: {
    ...TYPE.bodyStrong,
    fontSize: 15,
    marginBottom: 10,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  ajuda: {
    ...TYPE.caption,
    marginTop: 8,
  },

  campos: {
    marginTop: 18,
    gap: 10,
  },

  contador: {
    ...TYPE.small,
  },

  aceite: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 18,
  },

  caixa: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  caixaMarcada: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  caixaErro: {
    borderColor: COLORS.danger,
  },

  aceiteTexto: {
    ...TYPE.body,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  erro: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
    marginLeft: 38,
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

  botao: {
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

  botaoTexto: {
    color: COLORS.onPrimary,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
}));
