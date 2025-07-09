import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Create Client Controller (e2e)", async () => {
  let application: FastifyInstance;

  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "clients"`;
  });

  async function geraCookies() {
    await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@admin.com",
        password: await hashPassword("123456"),
        role: "ADMIN",
      },
    });
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

  it("should be able to create a fisic client", async () => {
    const cookies = await geraCookies();

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
          name: "John doe client",
          email: "johndoe@example.com",
          cpfCnpj: "470.223.910-41",
        }),
      })
    );
  });

  it("should be able to create a juridic client", async () => {
    const cookies = await geraCookies();

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
          name: "John doe ltda",
          email: "johndoe@example.com",
          cpfCnpj: "83.906.381/0001-08",
        }),
      })
    );
  });

  it("should be not able to create user with same cpf/cnpj", async () => {
    const cookies = await geraCookies();
    await prisma.client.create({
      data: {
        name: "John doe ltda",
        cpfCnpj: "83.906.381/0001-08",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });
    const response = await request(application.server)
      .post("/api/v1/users")
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
