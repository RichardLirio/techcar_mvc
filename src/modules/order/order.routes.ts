import { VerifyJWT } from "@/middlewares/verify-jwt";
import { FastifyInstance } from "fastify";
import { OrderController } from "./order.controller";

export async function ordersRoutes(app: FastifyInstance) {
  //instancio o controller
  const ordersController = new OrderController();

  app.post("/", { onRequest: [VerifyJWT] }, ordersController.create);

  app.delete("/:id", { onRequest: [VerifyJWT] }, ordersController.delete);

  app.get("/", { onRequest: [VerifyJWT] }, ordersController.findAll);

  app.get("/:id", { onRequest: [VerifyJWT] }, ordersController.findOne);

  app.patch("/:id", { onRequest: [VerifyJWT] }, ordersController.update);
}
