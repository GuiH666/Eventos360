/**
 * Recado entre telas.
 *
 * Quando o formulário fecha, a tela de baixo (Detalhes ou Inscrições) precisa
 * saber o que aconteceu para mostrar "Inscrição confirmada".
 * O formulário deixa o recado aqui e a outra tela lê ao voltar.
 */
let recado: string | null = null;

export const avisos = {
  definir(mensagem: string) {
    recado = mensagem;
  },

  /** Devolve o recado pendente (uma única vez) e limpa. */
  consumir(): string | null {
    const atual = recado;
    recado = null;
    return atual;
  },
};
