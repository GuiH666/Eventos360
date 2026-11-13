/*
 * Diferenças entre as plataformas.
 *
 * O Metro escolhe o arquivo certo pela extensão:
 *   plataforma.android.ts  -> Android
 *   plataforma.ios.ts      -> iOS
 *   plataforma.ts          -> web e qualquer outra (este arquivo)
 *
 * O TypeScript enxerga só este arquivo, por isso os três exportam
 * exatamente os mesmos nomes.
 */
export const CAMINHO_AJUSTES_NOTIFICACAO =
  "Abra as configurações do navegador e permita notificações para este site.";

export const ROTULO_COMPARTILHAR = "Compartilhar";

/** Quanto o Android pode atrasar um lembrete para economizar bateria. */
export const AVISO_PRECISAO_LEMBRETE = "";
