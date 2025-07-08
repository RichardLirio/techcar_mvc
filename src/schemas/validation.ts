import { z } from "zod";

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }

  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.charAt(10))) return false;

  return true;
}

// Função para validar CNPJ
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  let remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;

  if (remainder !== parseInt(cnpj.charAt(12))) return false;

  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;

  if (remainder !== parseInt(cnpj.charAt(13))) return false;

  return true;
}

// Validação customizada para CPF/CNPJ
export const cpfCnpjValidation = z.string().refine(
  (value) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length === 11) {
      return validateCPF(cleanValue);
    } else if (cleanValue.length === 14) {
      return validateCNPJ(cleanValue);
    }
    return false;
  },
  { message: "CPF ou CNPJ inválido" }
);
