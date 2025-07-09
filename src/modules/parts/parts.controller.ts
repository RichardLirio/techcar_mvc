import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import {
  CreatePartInput,
  createPartSchema,
  UpdatePartInput,
  updatePartSchema,
} from "@/schemas/parts.schemas";
import { SuccessResponse } from "@/@types/response";
import { IdParam, idParamSchema } from "@/schemas/common.schemas";
import { HttpError } from "@/utils/http-error";

export class PartController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createPartSchema.parse(request.body) as CreatePartInput;

    // Criar peça
    const part = await prisma.part.create({
      data,
    });

    const response: SuccessResponse = {
      success: true,
      message: "Peça criada com sucesso",
      data: { part },
    };

    return reply.status(201).send(response);
  }

  async findAll(_: FastifyRequest, reply: FastifyReply) {
    const parts = await prisma.part.findMany({
      include: {
        _count: {
          select: { orderItems: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Dados das peças obtidos com sucesso",
      data: { parts },
    };

    return reply.status(200).send(response);
  }

  async findOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            order: {
              include: {
                client: {
                  select: {
                    id: true,
                    name: true,
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
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!part) {
      throw new HttpError("Peça não encontrada", 400);
    }

    const response: SuccessResponse = {
      success: true,
      message: "Dados da peça obtidos com sucesso",
      data: { part },
    };

    return reply.status(200).send(response);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;
    const data = updatePartSchema.parse(request.body) as UpdatePartInput;

    // Verificar se a peça existe
    const existingPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      throw new HttpError("Peça não encontrada", 400);
    }

    // Atualizar peça
    const partUpdated = await prisma.part.update({
      where: { id },
      data,
    });

    const response: SuccessResponse = {
      success: true,
      message: "Peça atualizada com sucesso",
      data: { partUpdated },
    };

    return reply.status(200).send(response);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Verificar se a peça existe
    const existingPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      throw new HttpError("Peça não encontrada", 400);
    }

    // Verificar se a peça está sendo usada em ordens de serviço
    const orderItemsCount = await prisma.orderItem.count({
      where: { partId: id },
    });

    if (orderItemsCount > 0) {
      throw new HttpError(
        "Não é possível deletar peça que está sendo usada em ordens de serviço",
        400
      );
    }

    // Deletar peça
    await prisma.part.delete({
      where: { id },
    });

    return reply.status(204).send();
  }

  async updateStock(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;
    const { quantity } = request.body as { quantity: number };

    if (typeof quantity !== "number" || quantity < 0) {
      throw new HttpError(
        "Quantidade deve ser um número maior ou igual a 0",
        400
      );
    }

    // Verificar se a peça existe
    const existingPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      throw new HttpError("Peça não encontrada", 400);
    }

    // Atualizar estoque
    const part = await prisma.part.update({
      where: { id },
      data: { quantity },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Quantidade em estoque atualizada com sucesso",
      data: { part },
    };

    return reply.status(200).send(response);
  }
}
