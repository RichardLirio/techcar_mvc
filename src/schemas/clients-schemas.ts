import z from "zod";
import { cpfCnpjValidation } from "./validation";

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpfCnpj: cpfCnpjValidation,
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  address: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").optional(),
  cpfCnpj: cpfCnpjValidation.optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  address: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
