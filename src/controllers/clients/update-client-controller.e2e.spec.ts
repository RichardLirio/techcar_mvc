import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Update Client Controller (e2e)", async () => {
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

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
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

  it("should be able to update client", async () => {
    const cookies = await geraCookies();
    const client = await prisma.client.create({
      data: {
        name: "John doe client",
        cpfCnpj: "470.223.910-41",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const response = await request(application.server)
      .patch(`/api/v1/clients/${client.id}`) //pelo id do usuario
      .set("Cookie", cookies)
      .send({
        name: "John doe client Update",
        cpfCnpj: "83.906.381/0001-08",
        phone: "27997876755",
        email: "johndo@example.com",
        address: "Rua nova, numero 1, Vitoria-ES",
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        clientUpdated: expect.objectContaining({
          id: expect.any(String),
          name: "JOHN DOE CLIENT UPDATE",
          cpfCnpj: "83906381000108",
          phone: "27997876755",
          email: "johndo@example.com",
          address: "Rua nova, numero 1, Vitoria-ES",
        }),
      })
    );
  });

  it("should not be able to update client with cpf/cnpj already exists", async () => {
    const cookies = await geraCookies();
    await prisma.client.create({
      data: {
        name: "John doe client",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const client = await prisma.client.create({
      data: {
        name: "John doe ltda",
        cpfCnpj: "83.906.381/0001-08",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const response = await request(application.server)
      .patch(`/api/v1/clients/${client.id}`) //pelo id do usuario
      .set("Cookie", cookies)
      .send({
        name: "John doe client Update",
        cpfCnpj: "470.223.910-41",
        phone: "27997876755",
        email: "johndo@example.com",
        address: "Rua nova, numero 1, Vitoria-ES",
      });
    expect(response.statusCode).toEqual(409);
  });
});
