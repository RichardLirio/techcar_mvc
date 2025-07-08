import { AuthController } from "@/controllers/auth-controller";
import { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance) {
  //instancio o controller de autenticação
  const authController = new AuthController();

  app.post("/login", authController.login);
}
