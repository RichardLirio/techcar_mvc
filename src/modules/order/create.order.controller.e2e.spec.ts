import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Create Order Controller (e2e)", async () => {
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

    await prisma.user.create({
      data: {
        name: "User",
        email: "user@user.com",
        password: await hashPassword("123456"),
        role: "USER",
      },
    });
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE "vehicles" CASCADE`;
    await prisma.$executeRaw`TRUNCATE TABLE "clients" CASCADE`;
  });

  async function geraCookies(role: "USER" | "ADMIN") {
    if (role == "ADMIN") {
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

    const loginResponse = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "user@user.com",
        password: "123456",
      });

    const cookies = loginResponse.headers["set-cookie"];

    if (!cookies) {
      throw new Error("Cookie não encontrado após login");
    }

    return cookies;
  }

  it("should be able to create a order service", async () => {
    const cookies = await geraCookies("ADMIN");

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

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        completeOrder: expect.objectContaining({
          id: expect.any(String),
          clientId: client.id,
          vehicleId: vehicle.id,
          status: "IN_PROGRESS",
          description: "MANUTENÇÃO CORRETIVA",
          kilometers: 45000,
          discount: "0",
          totalValue: "170.4",
        }),
      })
    );
  });

  it("should not be able to create a order service with invalid client ID", async () => {
    const cookies = await geraCookies("ADMIN");

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.2,
      },
    });

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: "invalid-id",
        vehicleId: "invalid-id",
        description: "Manutenção corretiva",
        kilometers: 45000,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(404);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual("Cliente não encontrado");
  });

  it("should not be able to create a order service with invalid vehicle ID", async () => {
    const cookies = await geraCookies("ADMIN");

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    // Crio um novo cliente
    const anotherClient = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT 2",
        cpfCnpj: "36658112010",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    //veiculo irá pertencer a um cliente diferente enviado na ordem de serviço
    const vehicle = await prisma.vehicle.create({
      data: {
        plate: "PPW1020",
        model: "ARGO",
        brand: "FIAT",
        kilometers: 45000,
        year: 2018,
        clientId: anotherClient.id,
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

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(409);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual(
      "Veículo não encontrado ou não pertence ao cliente"
    );
  });

  it("should not be possible to create an ordering service with insufficient parts in stock", async () => {
    const cookies = await geraCookies("ADMIN");

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    //veiculo irá pertencer a um cliente diferente enviado na ordem de serviço
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
        quantity: 2, // tenho 2 no estoque
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.2,
      },
    });

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 3, unitPrice: Number(part.unitPrice) }, //envio 3 utilizadas
        ],
      });

    expect(response.statusCode).toEqual(409);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual(
      `Quantidade insuficiente em estoque para a peça ${part.name}. Disponível: ${part.quantity}, Solicitado: 3`
    );
  });

  it("shouldn't be possible to create a discounted ordering service without being an admin user", async () => {
    const cookies = await geraCookies("USER");

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    //veiculo irá pertencer a um cliente diferente enviado na ordem de serviço
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
        quantity: 2,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.2,
      },
    });

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        discount: 20,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 1, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(403);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual(
      "Apenas administradores podem aplicar descontos"
    );
  });

  it("should be possible to create a discounted ordering service being an admin user", async () => {
    const cookies = await geraCookies("ADMIN");

    const client = await prisma.client.create({
      data: {
        name: "JOHN DOE CLIENT",
        cpfCnpj: "47022391041",
        phone: "27997876754",
        email: "johndoe@example.com",
        address: "Rua nova, numero 2, Vitoria-ES",
      },
    });

    //veiculo irá pertencer a um cliente diferente enviado na ordem de serviço
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
        quantity: 2,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 50.22,
      },
    });

    const response = await request(application.server)
      .post("/api/v1/orders")
      .set("Cookie", cookies)
      .send({
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "Manutenção corretiva",
        kilometers: 45000,
        discount: 20,
        services: [
          { description: "troca de oleo", price: 30 },
          { description: "troca de filtro", price: 40 },
        ],
        items: [
          { partId: part.id, quantity: 1, unitPrice: Number(part.unitPrice) },
        ],
      });

    expect(response.statusCode).toEqual(201);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        completeOrder: expect.objectContaining({
          id: expect.any(String),
          clientId: client.id,
          vehicleId: vehicle.id,
          status: "IN_PROGRESS",
          description: "MANUTENÇÃO CORRETIVA",
          kilometers: 45000,
          discount: "20",
          totalValue: "100.22", // valor com desconto aplicado
        }),
      })
    );
  });
});
