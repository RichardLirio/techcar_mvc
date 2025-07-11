import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import {
  CreateOrderInput,
  createOrderSchema,
  UpdateOrderInput,
  updateOrderSchema,
} from "@/schemas/orders.schemas";
import { HttpError } from "@/utils/http-error";
import { SuccessResponse } from "@/@types/response";
import { IdParam, idParamSchema } from "@/schemas/common.schemas";

export class OrderController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createOrderSchema.parse(request.body) as CreateOrderInput;

    const user = request.user;

    // Verificar se o cliente existe
    const clientExists = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!clientExists) {
      throw new HttpError("Cliente não encontrado", 404);
    }

    // Verificar se o veículo existe e pertence ao cliente
    const vehicleExists = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicleExists || vehicleExists.clientId !== data.clientId) {
      throw new HttpError(
        "Veículo não encontrado ou não pertence ao cliente",
        409
      );
    }

    // Verificar disponibilidade de peças no estoque
    for (const item of data.items) {
      const part = await prisma.part.findUnique({
        where: { id: item.partId },
      });

      if (!part) {
        throw new HttpError(`Peça não encontrada: ${item.partId}`, 404);
      }

      if (part.quantity < item.quantity) {
        throw new HttpError(
          `Quantidade insuficiente em estoque para a peça ${part.name}. Disponível: ${part.quantity}, Solicitado: ${item.quantity}`,
          409
        );
      }
    }

    // Verificar se apenas admin pode aplicar descontos
    if (data.discount !== undefined && data.discount > 0) {
      if (user.role !== "ADMIN") {
        throw new HttpError(
          "Apenas administradores podem aplicar descontos",
          403
        );
      }
    }

    // Calcular valor total
    const servicesTotal = data.services.reduce(
      (sum, service) => sum + Number(service.price),
      0
    );
    const itemsTotal = data.items.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0
    );
    const totalValue = servicesTotal + itemsTotal - Number(data.discount);

    // Criar ordem em uma transação
    const order = await prisma.$transaction(async (tx) => {
      // Criar ordem
      const newOrder = await tx.order.create({
        data: {
          clientId: data.clientId,
          vehicleId: data.vehicleId,
          description: data.description,
          kilometers: data.kilometers,
          discount: data.discount,
          totalValue: totalValue,
          status: "IN_PROGRESS",
        },
      });

      // Criar serviços
      if (data.services.length > 0) {
        await tx.service.createMany({
          data: data.services.map((service) => ({
            orderId: newOrder.id,
            description: service.description,
            price: service.price,
          })),
        });
      }

      // Criar itens e atualizar estoque
      if (data.items.length > 0) {
        await tx.orderItem.createMany({
          data: data.items.map((item) => ({
            orderId: newOrder.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });

        // Atualizar estoque
        for (const item of data.items) {
          await tx.part.update({
            where: { id: item.partId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return newOrder;
    });

    // Buscar ordem completa
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Ordem de serviço criada sucesso",
      data: { completeOrder },
    };

    return reply.status(201).send(response);
  }

  async findAll(_: FastifyRequest, reply: FastifyReply) {
    const orders = await prisma.order.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Dados das ordens de serviço obtidos com sucesso",
      data: { orders },
    };

    return reply.status(200).send(response);
  }

  async findOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            phone: true,
            email: true,
            address: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
            year: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return reply
        .status(404)
        .send({ error: "Ordem de serviço não encontrada" });
    }

    const response: SuccessResponse = {
      success: true,
      message: "Dados da ordem de serviço obtido com sucesso",
      data: { order },
    };

    return reply.status(200).send(response);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;
    const data = updateOrderSchema.parse(request.body) as UpdateOrderInput;

    const user = request.user;

    // Verificar se a ordem existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        services: true,
        items: true,
      },
    });

    if (!existingOrder) {
      throw new HttpError("Ordem de serviço não encontrada", 404);
    }

    // Verificar se apenas admin pode aplicar descontos
    if (
      data.discount !== undefined &&
      Number(data.discount) !== Number(existingOrder.discount)
    ) {
      if (user.role !== "ADMIN") {
        throw new HttpError(
          "Apenas administradores podem aplicar descontos",
          403
        );
      }
    }

    // Verificar se o cliente existe (se fornecido)
    if (data.clientId) {
      const clientExists = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!clientExists) {
        throw new HttpError("Cliente não encontrado", 404);
      }
    }

    // Verificar se o veículo existe (se fornecido)
    if (data.vehicleId) {
      const vehicleExists = await prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });

      if (!vehicleExists) {
        throw new HttpError("Veículo não encontrado", 404);
      }

      // Verificar se o veículo pertence ao cliente
      const finalClientId = data.clientId || existingOrder.clientId;
      if (vehicleExists.clientId !== finalClientId) {
        throw new HttpError("Veículo não pertence ao cliente", 409);
      }
    }

    // Atualizar ordem em uma transação
    const order = await prisma.$transaction(async (tx) => {
      // Atualizar serviços se fornecidos
      if (data.services) {
        // Deletar serviços existentes
        await tx.service.deleteMany({
          where: { orderId: id },
        });

        // Criar novos serviços
        if (data.services.length > 0) {
          await tx.service.createMany({
            data: data.services.map((service) => ({
              orderId: id,
              description: service.description,
              price: service.price,
            })),
          });
        }
      }

      // Atualizar itens se fornecidos
      if (data.items) {
        // Restaurar estoque dos itens antigos
        for (const item of existingOrder.items) {
          await tx.part.update({
            where: { id: item.partId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // Deletar itens existentes
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        // Verificar disponibilidade de peças no estoque para novos itens
        for (const item of data.items) {
          const part = await tx.part.findUnique({
            where: { id: item.partId },
          });

          if (!part) {
            throw new HttpError(`Peça não encontrada: ${item.partId}`, 404);
          }

          if (part.quantity < item.quantity) {
            throw new HttpError(
              `Quantidade insuficiente em estoque para a peça ${part.name}. Disponível: ${part.quantity}, Solicitado: ${item.quantity}`,
              409
            );
          }
        }

        // Criar novos itens
        if (data.items.length > 0) {
          await tx.orderItem.createMany({
            data: data.items.map((item) => ({
              orderId: id,
              partId: item.partId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          });

          // Atualizar estoque
          for (const item of data.items) {
            await tx.part.update({
              where: { id: item.partId },
              data: {
                quantity: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      // Recalcular valor total
      const services = data.services || existingOrder.services;
      const items = data.items || existingOrder.items;

      const servicesTotal = services.reduce(
        (sum, service) => sum + Number(service.price),
        0
      );
      const itemsTotal = items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      );
      const finalDiscount =
        data.discount !== undefined ? data.discount : existingOrder.discount;
      const totalValue = servicesTotal + itemsTotal - Number(finalDiscount);

      // Atualizar ordem
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          clientId: data.clientId,
          vehicleId: data.vehicleId,
          description: data.description,
          discount: data.discount,
          status: data.status,
          totalValue: totalValue,
          kilometers: data.kilometers
            ? data.kilometers
            : existingOrder.kilometers,
        },
      });

      return updatedOrder;
    });

    // Buscar ordem completa atualizada
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
            year: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
                unitPrice: true,
              },
            },
          },
        },
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Ordem de serviço atualizada com sucesso",
      data: { completeOrder },
    };

    return reply.status(200).send(response);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Verificar se a ordem existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      throw new HttpError("Ordem de serviço não encontrada", 404);
    }

    // Verificar se a ordem pode ser deletada (apenas ordens em progresso)
    if (existingOrder.status === "COMPLETED") {
      throw new HttpError(
        "Não é possível deletar uma ordem de serviço concluída",
        409
      );
    }

    // Deletar ordem em uma transação
    await prisma.$transaction(async (tx) => {
      // Restaurar estoque das peças
      for (const item of existingOrder.items) {
        await tx.part.update({
          where: { id: item.partId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }

      // Deletar serviços associados
      await tx.service.deleteMany({
        where: { orderId: id },
      });

      // Deletar itens associados
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // Deletar ordem
      await tx.order.delete({
        where: { id },
      });
    });

    return reply.status(204).send();
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;
    const { status } = request.body as {
      status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    };

    // Validar status
    const validStatuses = ["IN_PROGRESS", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      throw new HttpError("Status inválido", 400);
    }

    // Verificar se a ordem existe
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      throw new HttpError("Ordem de serviço não encontrada", 404);
    }

    // Se cancelando, restaurar estoque
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED") {
      await prisma.$transaction(async (tx) => {
        // Restaurar estoque das peças
        for (const item of existingOrder.items) {
          await tx.part.update({
            where: { id: item.partId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }

        // Atualizar status da ordem
        await tx.order.update({
          where: { id },
          data: { status },
        });
      });
    } else {
      // Apenas atualizar status
      await prisma.order.update({
        where: { id },
        data: { status },
      });
    }

    const response: SuccessResponse = {
      success: true,
      message: "Status da ordem de serviço atualizado com sucesso",
    };

    return reply.status(200).send(response);
  }

  async getOrdersByClient(request: FastifyRequest, reply: FastifyReply) {
    const { clientId } = request.params as { clientId: string };

    const orders = await prisma.order.findMany({
      where: { clientId },
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            model: true,
            brand: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: `Ordens de serviço do cliente obtidas com sucesso`,
      data: { orders },
    };

    return reply.status(200).send(response);
  }

  async getOrdersByVehicle(request: FastifyRequest, reply: FastifyReply) {
    const { vehicleId } = request.query as { vehicleId: string };

    const orders = await prisma.order.findMany({
      where: { vehicleId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
        services: true,
        items: {
          include: {
            part: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Ordens de serviço do veículo obtidas com sucesso",
      data: { orders },
    };

    return reply.status(200).send(response);
  }
}
