export function formatCpfCnpj(cpfCnpj: string): string {
  cpfCnpj = cpfCnpj.replace(/[^\d]+/g, ""); //retira os caracters não numeros do cpf ou cnpj

  return cpfCnpj;
}
