import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Get Part Controller (e2e)", async () => {
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

  it("should be able to get part data", async () => {
    const cookies = await geraCookies("ADMIN", application);

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
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .get(`/api/v1/parts/invalid-id`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(404);
  });
});
