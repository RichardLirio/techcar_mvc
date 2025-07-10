import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Create Parts Controller (e2e)", async () => {
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

  it("should be able to create a part", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .post("/api/v1/parts")
      .set("Cookie", cookies)
      .send({
        name: "Filtro combustivel",
        quantity: 10,
        unitPrice: 99.9,
        description: "Filtro combustivel do argo 2018",
      });
    expect(response.statusCode).toEqual(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        part: expect.objectContaining({
          id: expect.any(String),
          name: "FILTRO COMBUSTIVEL",
          quantity: 10,
          description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        }),
      })
    );
  });
});
