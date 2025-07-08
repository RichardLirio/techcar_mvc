import z from "zod";

// Vehicle schemas
export const createVehicleSchema = z.object({
  plate: z.string().min(1, "Placa é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  brand: z.string().min(1, "Marca é obrigatória"),
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
  plate: z.string().min(1, "Placa é obrigatória").optional(),
  model: z.string().min(1, "Modelo é obrigatório").optional(),
  brand: z.string().min(1, "Marca é obrigatória").optional(),
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
