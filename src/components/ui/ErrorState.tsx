import React from "react";

import EmptyState from "./EmptyState";

type Props = {
  /** Mensagem técnica opcional (aparece em letra menor) */
  detalhe?: string | null;
  onTentar: () => void;
  titulo?: string;
  texto?: string;
};

/** Tela de erro, com botão para tentar de novo. */
export default function ErrorState({
  detalhe,
  onTentar,
  titulo = "Não foi possível carregar",
  texto = "Algo deu errado ao carregar os dados. Tente novamente.",
}: Props) {
  return (
    <EmptyState
      tom="erro"
      icone="alert-circle-outline"
      titulo={titulo}
      texto={texto}
      detalhe={detalhe ?? undefined}
      acao="Tentar novamente"
      onAcao={onTentar}
    />
  );
}
