/*
 * Regras de validação do formulário de inscrição.
 * Cada função devolve a mensagem de erro, ou null quando o valor é válido.
 */

export function validarNome(valor: string): string | null {
  const nome = valor.trim().replace(/\s+/g, " ");
  if (nome.length === 0) return "Informe seu nome.";
  if (nome.length < 3) return "O nome precisa ter pelo menos 3 letras.";
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(nome)) return "Use só letras no nome.";
  if (!nome.includes(" ")) return "Informe nome e sobrenome.";
  return null;
}

export function validarEmail(valor: string): string | null {
  const email = valor.trim();
  if (email.length === 0) return "Informe seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "Digite um e-mail válido, como nome@exemplo.com.";
  }
  return null;
}

/** Telefone é opcional; se vier preenchido precisa ter DDD + número. */
export function validarTelefone(valor: string): string | null {
  const digitos = apenasDigitos(valor);
  if (digitos.length === 0) return null;
  if (digitos.length < 10 || digitos.length > 11) {
    return "Use DDD + número, como (11) 91234-5678.";
  }
  return null;
}

export function validarObservacao(valor: string): string | null {
  if (valor.length > 200) return "Use no máximo 200 caracteres.";
  return null;
}

export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Máscara de telefone brasileiro enquanto a pessoa digita. */
export function mascararTelefone(valor: string): string {
  const d = apenasDigitos(valor).slice(0, 11);

  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
