import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Get Client Controller (e2e)", async () => {
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

  it("should be able to get client data", async () => {
    const cookies = await geraCookies("ADMIN", application);

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
      .get(`/api/v1/clients/${client.id}`) // buscar pelo id do cliente
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        client: expect.objectContaining({
          id: expect.any(String),
          name: "John doe client",
          cpfCnpj: "470.223.910-41",
          phone: "27997876754",
          email: "johndoe@example.com",
          address: "Rua nova, numero 2, Vitoria-ES",
        }),
      })
    );
  });

  it("should not to be able to get user profile with invalid id", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .get(`/api/v1/clients/invalid-id`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(404);
  });
});
