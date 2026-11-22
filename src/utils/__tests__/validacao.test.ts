import { describe, expect, it } from "vitest";
import {
  apenasDigitos,
  mascararTelefone,
  validarEmail,
  validarNome,
  validarObservacao,
  validarTelefone,
} from "../validacao";

describe("validarNome", () => {
  it("aceita nome e sobrenome, inclusive com acento", () => {
    expect(validarNome("Maria Souza")).toBeNull();
    expect(validarNome("José da Conceição")).toBeNull();
  });

  it("recusa vazio, curto, só um nome e caracteres inválidos", () => {
    expect(validarNome("   ")).toBe("Informe seu nome.");
    expect(validarNome("Al")).toBe("O nome precisa ter pelo menos 3 letras.");
    expect(validarNome("Maria")).toBe("Informe nome e sobrenome.");
    expect(validarNome("Maria 123")).toBe("Use só letras no nome.");
  });
});

describe("validarEmail", () => {
  it("aceita e-mail válido", () => {
    expect(validarEmail("aluno@faculdade.edu.br")).toBeNull();
  });

  it("recusa vazio e formato inválido", () => {
    expect(validarEmail("")).toBe("Informe seu e-mail.");
    expect(validarEmail("aluno@faculdade")).not.toBeNull();
    expect(validarEmail("aluno faculdade.com")).not.toBeNull();
  });
});

describe("validarTelefone", () => {
  it("é opcional", () => {
    expect(validarTelefone("")).toBeNull();
  });

  it("aceita 10 ou 11 dígitos, com ou sem máscara", () => {
    expect(validarTelefone("(11) 91234-5678")).toBeNull();
    expect(validarTelefone("1132345678")).toBeNull();
  });

  it("recusa número incompleto ou longo demais", () => {
    expect(validarTelefone("12345")).not.toBeNull();
    expect(validarTelefone("123456789012")).not.toBeNull();
  });
});

describe("validarObservacao", () => {
  it("aceita até 200 caracteres", () => {
    expect(validarObservacao("a".repeat(200))).toBeNull();
    expect(validarObservacao("a".repeat(201))).toBe("Use no máximo 200 caracteres.");
  });
});

describe("máscara de telefone", () => {
  it("extrai só os dígitos", () => {
    expect(apenasDigitos("(11) 9-1234")).toBe("1191234");
  });

  it("monta a máscara enquanto digita", () => {
    expect(mascararTelefone("")).toBe("");
    expect(mascararTelefone("1")).toBe("(1");
    expect(mascararTelefone("11912")).toBe("(11) 912");
    expect(mascararTelefone("1132345678")).toBe("(11) 3234-5678");
    expect(mascararTelefone("11912345678")).toBe("(11) 91234-5678");
  });

  it("ignora dígitos além de 11", () => {
    expect(mascararTelefone("119123456789999")).toBe("(11) 91234-5678");
  });
});
