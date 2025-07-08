import { compare } from "bcryptjs";

// Verificação da senha
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await compare(password, hashedPassword);
};
