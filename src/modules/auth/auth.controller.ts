import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@/lib/database";
import { LoginInput, loginSchema } from "@/schemas/users.schemas";
import { HttpError } from "@/utils/http-error";
import { comparePassword } from "@/utils/compare-password";
import { env } from "@/env";
import { SuccessResponse } from "@/@types/response";

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const data = loginSchema.parse(request.body) as LoginInput;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new HttpError("Email não registrado", 401);
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new HttpError("Credenciais inválidas", 401);
    }

    const token = await reply.jwtSign(
      {
        role: user.role,
      },
      {
        sign: {
          sub: user.id,
        },
      }
    ); // Cria o token JWT com o id do usuário e o papel (role) do usuário

    const refreshToken = await reply.jwtSign(
      {
        role: user.role,
      },
      {
        sign: {
          sub: user.id,
          expiresIn: "7d",
        },
      }
    ); // Cria o refresh token JWT com o id do usuário e o papel (role) do usuário, com validade de 7 dias

    const response: SuccessResponse = {
      success: true,
      message: "Login realizado com sucesso",
      data: { token },
    };

    return reply
      .setCookie("refreshToken", refreshToken, {
        path: "/",
        secure: env.NODE_ENV === "production", //https
        sameSite: "strict",
        httpOnly: true,
      })
      .status(200)
      .send(response);
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    // Verificar se o cookie existe
    if (!request.cookies.refreshToken) {
      throw new HttpError("Nenhuma sessão ativa encontrada", 400);
    }

    // Limpar o cookie
    return reply
      .clearCookie("refreshToken", {
        path: "/",
        secure: env.NODE_ENV === "production", // https
        sameSite: "strict",
        httpOnly: true,
      })
      .status(200)
      .send({
        message: "Logout realizado com sucesso",
        success: true,
      });
  }

  async profile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.sub;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
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
      message: "Dados do usuário logado",
      data: { user },
    };

    return reply.status(200).send(response);
  }
}
