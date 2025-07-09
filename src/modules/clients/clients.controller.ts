import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import {
  CreateClientInput,
  createClientSchema,
  UpdateClientInput,
  updateClientSchema,
} from "@/schemas/clients.schemas";
import { HttpError } from "@/utils/http-error";
import { SuccessResponse } from "@/@types/response";
import { IdParam, idParamSchema } from "@/schemas/common.schemas";

export class ClientController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createClientSchema.parse(request.body) as CreateClientInput;

    // Verificar se o CPF/CNPJ já existe
    const existingClient = await prisma.client.findUnique({
      where: { cpfCnpj: data.cpfCnpj },
    });

    if (existingClient) {
      throw new HttpError("CPF/CNPJ já está em uso", 409);
    }

    // Criar cliente
    const client = await prisma.client.create({
      data,
    });

    const response: SuccessResponse = {
      success: true,
      message: "Cliente criado com sucesso",
      data: { client },
    };

    return reply.status(201).send(response);
  }

  async findAll(_: FastifyRequest, reply: FastifyReply) {
    const clients = await prisma.client.findMany({
      include: {
        vehicles: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Dados dos usuários obtidos com sucesso",
      data: { clients },
    };

    return reply.status(200).send(response);
  }

  async findOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        vehicles: true,
        orders: {
          include: {
            vehicle: true,
            services: true,
            items: {
              include: {
                part: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!client) {
      throw new HttpError("Cliente não encontrado", 400);
    }

    const response: SuccessResponse = {
      success: true,
      message: "Dados do cliente obtidos com sucesso",
      data: { client },
    };

    return reply.status(200).send(response);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const data = updateClientSchema.parse(request.body) as UpdateClientInput;

    // Verificar se o cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new HttpError("Cliente não encontrado", 400);
    }

    // Verificar se o CPF/CNPJ já está em uso por outro cliente
    if (data.cpfCnpj && data.cpfCnpj !== existingClient.cpfCnpj) {
      const cpfCnpjExists = await prisma.client.findUnique({
        where: { cpfCnpj: data.cpfCnpj },
      });

      if (cpfCnpjExists) {
        throw new HttpError("CPF/CNPJ já está em uso", 409);
      }
    }

    // Atualizar cliente
    const clientUpdated = await prisma.client.update({
      where: { id },
      data,
      include: {
        vehicles: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Usuário atualizado com sucesso",
      data: { clientUpdated },
    };

    return reply.status(200).send(response);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Verificar se o cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new HttpError("Cliente não encontrado", 400);
    }

    // Verificar se o cliente possui ordens de serviço
    const ordersCount = await prisma.order.count({
      where: { clientId: id },
    });

    if (ordersCount > 0) {
      throw new HttpError(
        "Não é possível deletar cliente com ordens de serviço cadastradas",
        400
      );
    }

    // Deletar cliente (veículos serão deletados em cascata)
    await prisma.client.delete({
      where: { id },
    });

    return reply.status(204).send();
  }
}
