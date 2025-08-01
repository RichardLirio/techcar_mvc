import { FastifyInstance } from "fastify";
import { buildApp } from "./app";
import { env } from "./env";
import { seed } from "./seed";

class Server {
  private app: FastifyInstance | null = null;

  async initialize() {
    this.app = await buildApp();
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown() {
    if (!this.app) return;

    const signals = ["SIGTERM", "SIGINT"];

    signals.forEach((signal) => {
      process.on(signal, async () => {
        this.app?.log.info(`Recebido sinal ${signal}, fechando servidor...`);

        try {
          await this.app?.close();
          this.app?.log.info("Servidor fechado com sucesso");
          process.exit(0);
        } catch (error) {
          this.app?.log.error("Erro ao fechar servidor:", error);
          process.exit(1);
        }
      });
    });

    // Configurar handlers globais que não interferem com o Fastify
    process.on("uncaughtException", (error) => {
      this.app?.log.fatal("Uncaught Exception:", error);

      // Dar tempo para o log ser processado antes de sair
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on("unhandledRejection", (reason, promise) => {
      this.app?.log.fatal(
        "Unhandled Rejection at:",
        promise,
        "reason:",
        reason
      );
      process.exit(1);
    });
  }

  async start() {
    try {
      if (!this.app) {
        await seed();
        await this.initialize();
      }

      if (!this.app) {
        throw new Error("Falha ao inicializar a aplicação");
      }

      await this.app.listen({
        port: env.PORT,
        host: "0.0.0.0",
      });

      console.log(`Servidor rodando em http://${env.HOST}:${env.PORT}`);
      console.log(`Health check: http://${env.HOST}:${env.PORT}/health`);
      console.log(`Ambiente: ${env.NODE_ENV}`);
    } catch (error) {
      console.error("Erro ao iniciar servidor:", error);
      process.exit(1);
    }
  }

  // Método para obter a instância do app (útil para testes)
  getApp(): FastifyInstance | null {
    return this.app;
  }

  // Método para fechar o servidor (útil para testes)
  async close() {
    if (this.app) {
      await this.app.close();
    }
  }
}

// Inicializar servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  const server = new Server();
  server.start().catch((error) => {
    console.error("Falha ao iniciar servidor:", error);
    process.exit(1);
  });
}

export { Server };
export default Server;
