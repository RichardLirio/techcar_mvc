import { AuthController } from "@/modules/auth/auth.controller";
import { VerifyJWT } from "@/middlewares/verify-jwt";
import { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance) {
  //instancio o controller de autenticação
  const authController = new AuthController();

  app.post("/login", authController.login);

  app.post("/logout", { onRequest: [VerifyJWT] }, authController.logout);

  app.get("/profile", { onRequest: [VerifyJWT] }, authController.profile);
}
