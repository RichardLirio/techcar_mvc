import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateUserForTests } from "test/factories/create-users-for-tests";

describe("Fetch Clients Controller (e2e)", async () => {
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

  it("should be able to fetch all clients", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const response = await request(application.server)
      .get("/api/v1/clients")
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
  });
});
