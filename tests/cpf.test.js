import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidCPF, normalizeCPF, formatCPF, maskCPFForDisplay } from "../lib/cpf.js";

// 111.444.777-35 e um CPF de exemplo classico usado em tutoriais/testes
// (checksum valido, nao pertence a pessoa real).
const CPF_VALIDO = "111.444.777-35";

test("aceita CPF valido formatado", () => {
  assert.equal(isValidCPF(CPF_VALIDO), true);
});

test("aceita CPF valido so com digitos", () => {
  assert.equal(isValidCPF("11144477735"), true);
});

test("rejeita digito verificador errado", () => {
  assert.equal(isValidCPF("11144477730"), false);
});

test("rejeita todos os digitos iguais", () => {
  assert.equal(isValidCPF("11111111111"), false);
  assert.equal(isValidCPF("00000000000"), false);
});

test("rejeita tamanho errado", () => {
  assert.equal(isValidCPF("123456789"), false);
  assert.equal(isValidCPF("123456789012"), false);
});

test("rejeita vazio/nulo/undefined", () => {
  assert.equal(isValidCPF(""), false);
  assert.equal(isValidCPF(null), false);
  assert.equal(isValidCPF(undefined), false);
});

test("normalizeCPF remove pontuacao", () => {
  assert.equal(normalizeCPF("111.444.777-35"), "11144477735");
});

test("formatCPF aplica mascara", () => {
  assert.equal(formatCPF("11144477735"), "111.444.777-35");
});

test("maskCPFForDisplay esconde miolo", () => {
  assert.equal(maskCPFForDisplay("11144477735"), "111.***.***-35");
});
