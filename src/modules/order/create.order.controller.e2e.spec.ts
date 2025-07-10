import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Create Order Controller (e2e)", async () => {
  let application: FastifyInstance;

  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@admin.com",
        password: await hashPassword("123456"),
        role: "ADMIN",
      },
    });
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "vehicles" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
  });

  async function geraCookies() {
    const loginResponse = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "admin@admin.com",
        password: "123456",
      });

    const cookies = loginResponse.headers["set-cookie"];

    if (!cookies) {
      throw new Error("Cookie não encontrado após login");
    }

    return cookies;
  }

  it("should be able to create a order service", async () => {
    const cookies = await geraCookies();

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "PPW1020",
        model: "ARGO",
        brand: "FIAT",
        kilometers: 45000,
        year: 2018,
        clientId: client.id,
      },
    });

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.2,
      },
    });

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(201);

    expect(response.body.data).toEqual(
      expect.objectContaining({
        completeOrder: expect.objectContaining({
          id: expect.any(String),
          clientId: client.id,
          vehicleId: vehicle.id,
          status: "IN_PROGRESS",
          description: "MANUTENÇÃO CORRETIVA",
          kilometers: 45000,
          discount: "0",
          totalValue: "170.4",
        }),
      })
    );
  });
});
