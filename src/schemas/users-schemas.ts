import z from "zod";

// User schemas
export const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(1, "Nome é obrigatório"),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});

export const updateUserSchema = z.object({
  email: z.string().email("Email inválido").optional(),
  password: z
    .string()
    .min(6, "Senha deve ter pelo menos 6 caracteres")
    .optional(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
