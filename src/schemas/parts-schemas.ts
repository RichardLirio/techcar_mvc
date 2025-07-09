import z from "zod";

// Part schemas
export const createPartSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").toUpperCase(),
  quantity: z.number().int().min(0, "Quantidade deve ser maior ou igual a 0"),
  unitPrice: z.number().positive("Preço unitário deve ser positivo"),
  description: z.string().toUpperCase().optional(),
});

export const updatePartSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").toUpperCase().optional(),
  quantity: z
    .number()
    .int()
    .min(0, "Quantidade deve ser maior ou igual a 0")
    .optional(),
  unitPrice: z.number().positive("Preço unitário deve ser positivo").optional(),
  description: z.string().toUpperCase().optional(),
});

export type CreatePartInput = z.infer<typeof createPartSchema>;
export type UpdatePartInput = z.infer<typeof updatePartSchema>;
