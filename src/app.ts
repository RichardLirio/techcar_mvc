import fastify, { FastifyInstance } from "fastify";
import { env } from "./env";
import { HttpError } from "./utils/http-error";
import { ZodError } from "zod";
import { authRoutes } from "./modules/auth/auth.routes";
import { ErrorResponse, SuccessResponse } from "./@types/response";
import { usersRoutes } from "./modules/users/users.routes";
import { clientsRoutes } from "./modules/clients/clients.routes";

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "error" : "info",
      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "HH:MM:ss",
              },
            }
          : undefined,
    },
  });

  // Configurar tratamento de erros
  setupErrorHandling(app);

  // Registrar plugins
  await registerPlugins(app);

  // Registrar rotas
  await registerRoutes(app);

  return app;
}

async function registerPlugins(app: FastifyInstance) {
  // CORS
  await app.register(import("@fastify/cors"), {
    origin: env.CORS_ORIGINS || ["http://localhost:3333"],
    credentials: true,
  });

  // Rate limiting
  await app.register(import("@fastify/rate-limit"), {
    max: env.RATE_LIMIT_MAX || 100,
    timeWindow: "1 minute",
  });

  // Helmet para segurança básica
  await app.register(import("@fastify/helmet"));

  // Validação de entrada
  await app.register(import("@fastify/cookie"));

  // JWT (se configurado)
  if (env.JWT_SECRET) {
    await app.register(import("@fastify/jwt"), {
      secret: env.JWT_SECRET,
      cookie: {
        cookieName: "refreshToken",
        signed: false,
      },
      sign: {
        expiresIn: env.JWT_EXPIRES_IN,
      },
    });
  }
}

async function registerRoutes(app: FastifyInstance) {
  // Health check
  app.get("/health", async (_, reply) => {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(), // tempo de atividade do processo
      memory: process.memoryUsage(), // uso de memoria do processo
      version: process.version, // versao do nodejs
      environment: env.NODE_ENV || "development",
    };

    const response: SuccessResponse = {
      success: true,
      message: "Servidor funcionando normalmente",
      data: healthData,
    };

    reply.status(200).send(response);
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
  const prefix = "/api/v1";
  // Rotas da API
  await app.register(authRoutes, { prefix: `${prefix}` });
  await app.register(usersRoutes, { prefix: `${prefix}/users` });
  await app.register(clientsRoutes, { prefix: `${prefix}/clients` });
}

function setupErrorHandling(app: FastifyInstance) {
  // Handler de erros
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    // Verificar se a resposta já foi enviada
    if (reply.sent) {
      return;
    }
    if (error instanceof HttpError) {
      const response: ErrorResponse = {
        success: false,
        message: "Ops! Algo errado aconteceu",
        statusCode: error.statusCode,
        error: error.message,
      };
      return reply.status(error.statusCode).send(response);
    }

    // Tratar erros do Zod
    if (error instanceof ZodError) {
      const validationErrors = error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const response: ErrorResponse = {
        success: false,
        message: "Dados de solicitação inválidos",
        error: validationErrors,
        statusCode: 400,
      };

      return reply.status(400).send(response);
    }

    // Tratar outros erros HTTP conhecidos
    const statusCode = error.statusCode || 500;
    const message =
      statusCode >= 500 ? "Erro interno do servidor" : error.message;

    return reply.status(statusCode).send({
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    });
  });

  // Handler para rotas não encontradas
  app.setNotFoundHandler((request, reply) => {
    const response: ErrorResponse = {
      success: false,
      message: "Rota não encontrada",
      error: `Rote ${request.method} ${request.originalUrl} not found`,
      statusCode: 404,
    };

    return reply.status(404).send(response);
  });
}
