import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import {
  CreateVehicleInput,
  createVehicleSchema,
  UpdateVehicleInput,
  updateVehicleSchema,
} from "@/schemas/vehicles.schemas";
import { HttpError } from "@/utils/http-error";
import { SuccessResponse } from "@/@types/response";
import { IdParam, idParamSchema } from "@/schemas/common.schemas";

export class VehicleController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createVehicleSchema.parse(request.body) as CreateVehicleInput;

    // Verificar se o cliente existe
    const clientExists = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!clientExists) {
      throw new HttpError("Cliente não encontrado", 400);
    }

    // Verificar se a placa já existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: data.plate },
    });

    if (existingVehicle) {
      throw new HttpError("Placa já está em uso", 409);
    }

    // Criar veículo
    const vehicle = await prisma.vehicle.create({
      data,
    });

    const response: SuccessResponse = {
      success: true,
      message: "Cliente criado com sucesso",
      data: { vehicle },
    };

    return reply.status(201).send(response);
  }

  async findAll(_: FastifyRequest, reply: FastifyReply) {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
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
      message: "Dados dos veículos obtidos com sucesso",
      data: { vehicles },
    };

    return reply.status(200).send(response);
  }

  async findOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
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
        orders: {
          include: {
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

    if (!vehicle) {
      throw new HttpError("Veículo não encontrado", 400);
    }

    const response: SuccessResponse = {
      success: true,
      message: "Dados do veículo obtidos com sucesso",
      data: { vehicle },
    };

    return reply.status(200).send(response);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;
    const data = updateVehicleSchema.parse(request.body) as UpdateVehicleInput;

    // Verificar se o veículo existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      throw new HttpError("Veículo não encontrado", 400);
    }

    // Verificar se o cliente existe
    if (data.clientId) {
      const clientExists = await prisma.client.findUnique({
        where: { id: data.clientId },
      });

      if (!clientExists) {
        throw new HttpError("Cliente não encontrado", 400);
      }
    }

    // Verificar se a placa já está em uso por outro veículo
    if (data.plate && data.plate !== existingVehicle.plate) {
      const plateExists = await prisma.vehicle.findUnique({
        where: { plate: data.plate },
      });

      if (plateExists) {
        throw new HttpError("Placa já está em uso", 409);
      }
    }

    // Atualizar veículo
    const vehicleUpdated = await prisma.vehicle.update({
      where: { id },
      data,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            cpfCnpj: true,
          },
        },
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Veículo atualizado com sucesso",
      data: { vehicleUpdated },
    };

    return reply.status(200).send(response);
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Verificar se o veículo existe
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      throw new HttpError("Veículo não encontrado", 400);
    }

    // Verificar se o veículo possui ordens de serviço
    const ordersCount = await prisma.order.count({
      where: { vehicleId: id },
    });

    if (ordersCount > 0) {
      throw new HttpError(
        "Não é possível deletar veículo com ordens de serviço cadastradas",
        400
      );
    }

    // Deletar veículo
    await prisma.vehicle.delete({
      where: { id },
    });

    return reply.status(204).send();
  }
}
