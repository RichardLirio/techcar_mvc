import { VerifyJWT } from "@/middlewares/verify-jwt";
import { FastifyInstance } from "fastify";
import { PartController } from "./parts.controller";

export async function partsRoutes(app: FastifyInstance) {
  //instancio o controller
  const partsController = new PartController();

  app.post("/", { onRequest: [VerifyJWT] }, partsController.create);

  app.delete("/:id", { onRequest: [VerifyJWT] }, partsController.delete);

  app.get("/", { onRequest: [VerifyJWT] }, partsController.findAll);

  app.get("/:id", { onRequest: [VerifyJWT] }, partsController.findOne);

  app.patch("/:id", { onRequest: [VerifyJWT] }, partsController.update);
}
