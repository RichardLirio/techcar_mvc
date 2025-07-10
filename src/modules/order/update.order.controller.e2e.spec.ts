import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateOrderForTests } from "test/factories/create-order-for-tests";

describe("Update Order Controller (e2e)", async () => {
  let application: FastifyInstance;

  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
    await CreateUserForTests();
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  it("should be able to update a order service", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE LTDA",
        cpfCnpj: "33872166000157",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "PPW1025",
        model: "ARGO",
        brand: "FIAT",
        kilometers: 3000,
        year: 2018,
        clientId: client.id,
      },
    });

    const part = await prisma.part.create({
      data: {
        name: "FILTRO DO AR",
        quantity: 10,
        description: "FILTRO DO AR DO ARGO 2018",
        unitPrice: 10,
      },
    });

    const order = await CreateOrderForTests();

    const response = await request(application.server)
      .patch(`/api/v1/orders/${order.id}`)
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva do ar",
        kilometers: 3000,
        services: [{ description: "troca de filtro", price: 30 }],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        completeOrder: expect.objectContaining({
          id: expect.any(String),
          clientId: client.id,
          vehicleId: vehicle.id,
          description: "MANUTENÇÃO CORRETIVA DO AR",
          kilometers: 3000,
          discount: "0",
          totalValue: "50",
        }),
      })
    );
  });
});
