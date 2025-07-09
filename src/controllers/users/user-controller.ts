import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import {
  CreateUserInput,
  createUserSchema,
  UpdateUserInput,
  updateUserSchema,
} from "@/schemas/users-schemas";
import { HttpError } from "@/utils/http-error";
import { SuccessResponse } from "@/@types/response";
import { hashPassword } from "@/utils/hash-password";
import { IdParam, idParamSchema } from "@/schemas/common-schemas";

export class UsersController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = createUserSchema.parse(request.body) as CreateUserInput;

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new HttpError("Email já está em uso", 409);
    }

    // Hash da senha
    const hashedPassword = await hashPassword(data.password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Usuário criado com sucesso",
      data: { user },
    };

    return reply.status(201).send(response);
  }

  async deleteById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Deleta Usuario
    const user = await prisma.user.delete({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpError("Usuário não existe", 400);
    }

    return reply.status(204).send();
  }

  async fetch(_: FastifyRequest, reply: FastifyReply) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Dados dos usuários recuperados com sucesso",
      data: { users },
    };

    return reply.status(200).send(response);
  }

  async getById(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    const { id } = idParamSchema.parse(request.params) as IdParam;

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpError("Usuário não existe", 400);
    }

    const response: SuccessResponse = {
      success: true,
      message: "Dados do usuário recuperado com sucesso",
      data: { user },
    };

    return reply.status(200).send(response);
  }

  async update(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply
  ) {
    const data = updateUserSchema.parse(request.body) as UpdateUserInput;

    const { id } = idParamSchema.parse(request.params) as IdParam;

    // Verificar se o usuario existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new HttpError("Usuário não existe", 400);
    }

    if (data.email && data.email !== user.email) {
      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      });

      if (userWithSameEmail) {
        throw new HttpError("Email já está em uso", 400);
      }

      user.email = data.email;
    }

    if (data.name) {
      user.name = data.name;
    }

    if (data.password) {
      const passwordHashed = await hashPassword(data.password);
      user.password = passwordHashed;
    }

    // atualiza usuário
    const userUpdated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        ...user,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const response: SuccessResponse = {
      success: true,
      message: "Usuário atualizado com sucesso",
      data: { userUpdated },
    };

    return reply.status(200).send(response);
  }
}
