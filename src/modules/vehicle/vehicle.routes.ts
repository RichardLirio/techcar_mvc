import { VerifyJWT } from "@/middlewares/verify-jwt";
import { FastifyInstance } from "fastify";
import { VehicleController } from "./vehicle.controller";

export async function vehiclesRoutes(app: FastifyInstance) {
  //instancio o controller
  const vehiclesController = new VehicleController();

  app.post("/", { onRequest: [VerifyJWT] }, vehiclesController.create);

  app.delete("/:id", { onRequest: [VerifyJWT] }, vehiclesController.delete);

  app.get("/", { onRequest: [VerifyJWT] }, vehiclesController.findAll);

  app.get("/:id", { onRequest: [VerifyJWT] }, vehiclesController.findOne);

  app.patch("/:id", { onRequest: [VerifyJWT] }, vehiclesController.update);
}
