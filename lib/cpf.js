// Validador de CPF (algoritmo mod 11) + utilitarios de formatacao.
// Usado no formulario de voto (index.html) e no painel admin.

function normalizeCPF(cpf) {
  return String(cpf || "").replace(/\D/g, "");
}

function formatCPF(cpf) {
  const d = normalizeCPF(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}

function isValidCPF(cpf) {
  const d = normalizeCPF(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // 11111111111, 22222222222 etc

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== parseInt(d[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  if (check2 !== parseInt(d[10], 10)) return false;

  return true;
}

function maskCPFForDisplay(cpf) {
  const d = normalizeCPF(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.***.***-${d.slice(9, 11)}`;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { normalizeCPF, formatCPF, isValidCPF, maskCPFForDisplay };
}
