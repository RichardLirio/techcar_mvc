import z from "zod";

// Common schemas
export const idParamSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
});

export type IdParam = z.infer<typeof idParamSchema>;
