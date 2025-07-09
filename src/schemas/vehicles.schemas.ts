import { formatarPlaca } from "@/utils/formata-placa-veiculos";
import z from "zod";

// Vehicle schemas
export const createVehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória").transform(formatarPlaca),
  model: z.string().min(1, "Modelo é obrigatório").toUpperCase(),
  brand: z.string().min(1, "Marca é obrigatória").toUpperCase(),
  kilometers: z.number().min(1, "Quilometragem é obrigatória"),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  clientId: z.string().min(1, "Cliente é obrigatório"),
});

export const updateVehicleSchema = z.object({
  plate: z
    .string()
    .min(1, "Placa é obrigatória")
    .transform(formatarPlaca)
    .optional(),
  model: z.string().min(1, "Modelo é obrigatório").toUpperCase().optional(),
  brand: z.string().min(1, "Marca é obrigatória").toUpperCase().optional(),
  kilometers: z.number().min(1, "Quilometragem é obrigatória"),
  year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  clientId: z.string().min(1, "Cliente é obrigatório").optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
