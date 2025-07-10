import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Update Order Controller (e2e)", async () => {
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
    await prisma.$executeRaw`TRUNCATE TABLE "vehicles" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
  });

  async function geraOrder() {
    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "PPW1020",
        model: "ARGO",
        brand: "FIAT",
        kilometers: 45000,
        year: 2018,
        clientId: client.id,
      },
    });

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.2,
      },
    });
    const services = [
      { description: "troca de oleo", price: 30 },
      { description: "troca de filtro", price: 40 },
    ];

    const items = [
      { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
    ];

    const order = await prisma.$transaction(async (tx) => {
      // Criar ordem
      const newOrder = await tx.order.create({
        data: {
          clientId: client.id,
          vehicleId: vehicle.id,
          description: "MANUTENÇÃO CORRETIVA",
          kilometers: 45000,
          discount: 0,
          totalValue: 170.4,
          status: "IN_PROGRESS",
        },
      });

      // Criar serviços
      if (services.length > 0) {
        await tx.service.createMany({
          data: services.map((service) => ({
            orderId: newOrder.id,
            description: service.description,
            price: service.price,
          })),
        });
      }

      // Criar itens e atualizar estoque
      if (items.length > 0) {
        await tx.orderItem.createMany({
          data: items.map((item) => ({
            orderId: newOrder.id,
            partId: item.partId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        });

        // Atualizar estoque
        for (const item of items) {
          await tx.part.update({
            where: { id: item.partId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      return newOrder;
    });

    return order;
  }

  it("should be able to update a order service", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE LTDA",
        cpfCnpj: "33872166000157",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "PPW1025",
        model: "ARGO",
        brand: "FIAT",
        kilometers: 3000,
        year: 2018,
        clientId: client.id,
      },
    });

    const part = await prisma.part.create({
      data: {
        name: "FILTRO DO AR",
        quantity: 10,
        description: "FILTRO DO AR DO ARGO 2018",
        unitPrice: 10,
      },
    });

    const order = await geraOrder();

    const response = await request(application.server)
      .patch(`/api/v1/orders/${order.id}`)
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva do ar",
        kilometers: 3000,
        services: [{ description: "troca de filtro", price: 30 }],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        completeOrder: expect.objectContaining({
          id: expect.any(String),
          clientId: client.id,
          vehicleId: vehicle.id,
          description: "MANUTENÇÃO CORRETIVA DO AR",
          kilometers: 3000,
          discount: "0",
          totalValue: "50",
        }),
      })
    );
  });
});
