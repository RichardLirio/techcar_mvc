import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateOrderForTests } from "test/factories/create-order-for-tests";
import { prisma } from "@/lib/database";

describe("Delete Order Controller (e2e)", async () => {
  let application: FastifyInstance;

  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
    await CreateUserForTests();
  });

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  it("should be able to delete a order service", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const order = await CreateOrderForTests();

    const response = await request(application.server)
      .delete(`/api/v1/orders/${order.id}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(204);
  });

  it("should be not able to delete a order service completed", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const order = await CreateOrderForTests("COMPLETED");

    const response = await request(application.server)
      .delete(`/api/v1/orders/${order.id}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(409);
  });
});
