import z from "zod";
import { cpfCnpjValidation } from "./validation";
import { formatCpfCnpj } from "@/utils/formata-cpfCnpj";

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").toUpperCase(),
  cpfCnpj: cpfCnpjValidation.transform(formatCpfCnpj),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  address: z.string().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").toUpperCase().optional(),
  cpfCnpj: cpfCnpjValidation.transform(formatCpfCnpj).optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  address: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
