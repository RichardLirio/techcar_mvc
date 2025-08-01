import z from "zod";

// Order schemas
export const serviceSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").toUpperCase(),
  price: z.coerce
    .number()
    .min(0, "Preço deve ser positivo")
    .transform((val) => Number(val.toFixed(2))), // Arredonda corretamente
});

export const orderItemSchema = z.object({
  partId: z.string().min(1, "Peça é obrigatória"),
  quantity: z.number().int().positive("Quantidade deve ser positiva"),
  unitPrice: z.coerce
    .number()
    .min(0, "Preço deve ser positivo")
    .transform((val) => Number(val.toFixed(2))), // Arredonda corretamente
});

export const createOrderSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório"),
  vehicleId: z.string().min(1, "Veículo é obrigatório"),
  description: z.string().toUpperCase().optional(),
  kilometers: z.number().min(1, "Quilometragem é obrigatória"),
  discount: z
    .number()
    .min(0, "Desconto deve ser maior ou igual a 0")
    .default(0),
  services: z
    .array(serviceSchema)
    .min(1, "Pelo menos um serviço é obrigatório"),
  items: z.array(orderItemSchema).default([]),
});

export const updateOrderSchema = z.object({
  clientId: z.string().min(1, "Cliente é obrigatório").optional(),
  vehicleId: z.string().min(1, "Veículo é obrigatório").optional(),
  description: z.string().toUpperCase().optional(),
  kilometers: z.number().min(1, "Quilometragem é obrigatória").optional(),
  discount: z
    .number()
    .min(0, "Desconto deve ser maior ou igual a 0")
    .optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  services: z.array(serviceSchema).optional(),
  items: z.array(orderItemSchema).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
