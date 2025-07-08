import { AuthController } from "@/controllers/auth-controller";
import { VerifyJWT } from "@/middlewares/verify-jwt";
import { VerifyUserRole } from "@/middlewares/verify-user-role";
import { FastifyInstance } from "fastify";

export async function authRoutes(app: FastifyInstance) {
  //instancio o controller de autenticação
  const authController = new AuthController();

  app.post("/login", authController.login);

  app.post(
    "/register",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    authController.register
  );

  app.post("/logout", { onRequest: [VerifyJWT] }, authController.logout);

  app.get("/profile", { onRequest: [VerifyJWT] }, authController.profile);
}
