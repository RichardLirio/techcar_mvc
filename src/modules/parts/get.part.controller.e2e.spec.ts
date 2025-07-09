import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Get Part Controller (e2e)", async () => {
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

  it("should be able to get part data", async () => {
    const cookies = await geraCookies();

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 99,
      },
    });

    const response = await request(application.server)
      .get(`/api/v1/parts/${part.id}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        part: expect.objectContaining({
          id: expect.any(String),
          name: "FILTRO COMBUSTIVEL",
          quantity: 10,
          description: "FILTRO COMBUSTIVEL DO ARGO 2018",
          unitPrice: "99",
        }),
      })
    );
  });

  it("should not to be able to get part data with invalid id", async () => {
    const cookies = await geraCookies();

    const response = await request(application.server)
      .get(`/api/v1/parts/invalid-id`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(404);
  });
});
