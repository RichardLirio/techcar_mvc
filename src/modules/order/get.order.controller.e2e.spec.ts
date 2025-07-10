import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";
import { prisma } from "@/lib/database";
import { CreateOrderForTests } from "test/factories/create-order-for-tests";

describe("Get Order by clientID and VehicleID Controller (e2e)", async () => {
  let application: FastifyInstance;
  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
    await CreateUserForTests();
    await CreateOrderForTests();
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  it("should be able to get order data", async () => {
    const cookies = await geraCookies("ADMIN", application);
    const client = await prisma.client.findFirst();

    const response = await request(application.server)
      .get(`/api/v1/orders/client/${client?.id}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
  });

  it("should be able to get order data by vehicle ID", async () => {
    const cookies = await geraCookies("ADMIN", application);
    const vehicle = await prisma.client.findFirst();

    const response = await request(application.server)
      .get(`/api/v1/orders/vehicle/${vehicle?.id}`)
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
  });
});
