import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateOrderForTests } from "test/factories/create-order-for-tests";
import { prisma } from "@/lib/database";

describe("Update Status Order Controller (e2e)", async () => {
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

  it("should be able to update status for order service", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const order = await CreateOrderForTests();

    const response = await request(application.server)
      .patch(`/api/v1/orders/status/${order.id}`)
      .set("Cookie", cookies)
      .send({
        status: "COMPLETED",
      });

    expect(response.statusCode).toEqual(200);
  });

  it("should be able to return the part to stock after canceling a work order", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const order = await CreateOrderForTests(); //cria order utilizando 2 peças de 10
    const part = await prisma.part.findFirst({
      where: {
        orderItems: {
          some: { orderId: order.id },
        },
      },
    });

    expect(part?.quantity).toEqual(8); // ter somente 8 apos criar a order

    const response = await request(application.server)
      .patch(`/api/v1/orders/status/${order.id}`)
      .set("Cookie", cookies)
      .send({
        status: "CANCELLED",
      }); // ao cancelar deve obter novamente 10 em estoque

    expect(response.statusCode).toEqual(200);

    const partAfterCancelledOrder = await prisma.part.findFirst({
      where: {
        orderItems: {
          some: { orderId: order.id },
        },
      },
    });

    expect(partAfterCancelledOrder?.quantity).toEqual(10); // voltar a ter 10 apos cancelar a order
  });
});
