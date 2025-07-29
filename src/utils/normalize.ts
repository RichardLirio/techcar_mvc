export function formatarPlaca(placa: string): string {
  // Remove qualquer caractere que não seja letra ou número e converte letras para maiúsculas
  placa = placa
    .replace(/[^a-zA-Z0-9]/g, "") // Remove hífens, espaços, etc.
    .toUpperCase(); // Converte para maiúsculas

  return placa;
}

export function formatCpfCnpj(cpfCnpj: string): string {
  cpfCnpj = cpfCnpj.replace(/[^\d]+/g, ""); //retira os caracters não numeros do cpf ou cnpj

  return cpfCnpj;
}
