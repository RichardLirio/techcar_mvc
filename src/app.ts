import fastify, { FastifyInstance } from "fastify";
import { env } from "./env";
import { HttpError } from "./utils/http-error";
import { ZodError } from "zod";

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
  app.get("/health", async () => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Rotas da API
  await app.register(
    async (fastify) => {
      // Rota de teste
      fastify.get("/test", async () => {
        try {
          throw new HttpError("erro test", 400);
        } catch (error) {
          return error;
        }
      });
    },
    { prefix: "/api/v1" }
  );
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
      return reply.status(error.statusCode).send({
        error: true,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
      });
    }

    // Tratar erros do Zod
    if (error instanceof ZodError) {
      const validationErrors = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      return reply.status(400).send({
        error: true,
        message: "Dados de entrada inválidos",
        statusCode: 400,
        validationErrors,
        timestamp: new Date().toISOString(),
      });
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
  app.setNotFoundHandler((_, reply) => {
    return reply.status(404).send({
      error: true,
      message: "Rota não encontrada",
      statusCode: 404,
      timestamp: new Date().toISOString(),
    });
  });
}
