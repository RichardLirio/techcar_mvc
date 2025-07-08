import { hash } from "bcryptjs";

// Hash da senha
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await hash(password, saltRounds);
};
