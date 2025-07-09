import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Get Vehicle Controller (e2e)", async () => {
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

  it("should be able to get vehicle data", async () => {
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
        kilometers: 10000,
        year: 2017,
        clientId: client.id,
      },
    });
    const response = await request(application.server)
      .get(`/api/v1/vehicles/${vehicle.id}`) // buscar pelo id do vehiclee
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        vehicle: expect.objectContaining({
          id: expect.any(String),
          plate: "PPW1020",
          model: "ARGO",
          brand: "FIAT",
          kilometers: 10000,
          year: 2017,
          clientId: client.id,
        }),
      })
    );
  });

  it("should not to be able to get vehicle data with invalid id", async () => {
    const cookies = await geraCookies();

    const response = await request(application.server)
      .get(`/api/v1/vehicles/invalid-id`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(404);
  });
});
