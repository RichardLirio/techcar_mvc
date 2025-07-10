import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Create Client Controller (e2e)", async () => {
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

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
  });

  it("should be able to create a fisic client", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .post("/api/v1/clients")
      .set("Cookie", cookies)
      .send({
        name: "John doe client",
        cpfCnpj: "470.223.910-41",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        client: expect.objectContaining({
          id: expect.any(String),
          name: "JOHN DOE CLIENT",
          email: "johndoe@example.com",
          cpfCnpj: "47022391041",
        }),
      })
    );
  });

  it("should be able to create a juridic client", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .post("/api/v1/clients")
      .set("Cookie", cookies)
      .send({
        name: "John doe ltda",
        cpfCnpj: "83.906.381/0001-08",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        client: expect.objectContaining({
          id: expect.any(String),
          name: "JOHN DOE LTDA",
          email: "johndoe@example.com",
          cpfCnpj: "83906381000108",
        }),
      })
    );
  });

  it("should be not able to create client with same cpf/cnpj", async () => {
    const cookies = await geraCookies("ADMIN", application);

    await prisma.client.create({
      data: {
        name: "John doe ltda",
        cpfCnpj: "83906381000108",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });
    const response = await request(application.server)
      .post("/api/v1/clients")
      .set("Cookie", cookies)
      .send({
        name: "John doe ltda",
        cpfCnpj: "83.906.381/0001-08",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      });
    expect(response.statusCode).toEqual(409); // erro de retorno
  });
});
