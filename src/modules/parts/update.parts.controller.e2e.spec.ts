import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Update Part Controller (e2e)", async () => {
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

  it("should be able to update part", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 90,
      },
    });

    const response = await request(application.server)
      .patch(`/api/v1/parts/${part.id}`)
      .set("Cookie", cookies)
      .send({
        name: "FILTRO COMBUSTIVEL updated",
        quantity: 20,
        description: "FILTRO COMBUSTIVEL DO ARGO 2020",
        unitPrice: 88,
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        partUpdated: expect.objectContaining({
          id: expect.any(String),
          name: "FILTRO COMBUSTIVEL UPDATED",
          quantity: 20,
          description: "FILTRO COMBUSTIVEL DO ARGO 2020",
          unitPrice: "88",
        }),
      })
    );
  });

  it("should not to be able to update part data with invalid id", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .patch(`/api/v1/parts/invalid-id`)
      .set("Cookie", cookies)
      .send({
        plate: "PPW-1021",
        model: "Siena",
        brand: "Fiat",
        kilometers: 20000,
        year: 2019,
      });

    expect(response.statusCode).toEqual(404);
  });
});
