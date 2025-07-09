import { ClientController } from "@/modules/clients/clients.controller";
import { VerifyJWT } from "@/middlewares/verify-jwt";
import { VerifyUserRole } from "@/middlewares/verify-user-role";
import { FastifyInstance } from "fastify";

export async function clientsRoutes(app: FastifyInstance) {
  //instancio o controller
  const clientsController = new ClientController();

  app.post("/", { onRequest: [VerifyJWT] }, clientsController.create);

  app.delete(
    "/:id",
    { onRequest: [VerifyJWT, VerifyUserRole("ADMIN")] },
    clientsController.delete
  );

  app.get("/", { onRequest: [VerifyJWT] }, clientsController.findAll);

  app.get("/:id", { onRequest: [VerifyJWT] }, clientsController.findOne);

  app.patch("/:id", { onRequest: [VerifyJWT] }, clientsController.update);
}
