import { UsersController } from "@/controllers/users/user-controller";
import { VerifyJWT } from "@/middlewares/verify-jwt";
import { VerifyUserRole } from "@/middlewares/verify-user-role";
import { FastifyInstance } from "fastify";

export async function usersRoutes(app: FastifyInstance) {
  //instancio o controller
  const usersController = new UsersController();

  app.post(
    "/",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    usersController.create
  );

  app.delete(
    "/:id",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    usersController.deleteById
  );

  app.get(
    "/",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    usersController.fetch
  );

  app.get(
    "/:id",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    usersController.getById
  );

  app.patch(
    "/:id",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    usersController.update
  );
}
