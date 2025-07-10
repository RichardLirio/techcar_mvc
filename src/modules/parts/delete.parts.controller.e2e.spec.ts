import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateUserForTests } from "test/factories/create-users-for-tests";

describe("Delete Part Controller (e2e)", async () => {
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

  it("should be able to delete a part", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const part = await prisma.part.create({
      data: {
        name: "FILTRO COMBUSTIVEL",
        quantity: 10,
        description: "FILTRO COMBUSTIVEL DO ARGO 2018",
        unitPrice: 80,
      },
    });

    const response = await request(application.server)
      .delete(`/api/v1/parts/${part.id}`)
      .set("Cookie", cookies);
    expect(response.statusCode).toEqual(204);

    const partExist = await prisma.part.findUnique({
      where: { id: part.id },
    });

    expect(partExist).toBeNull();
  });
});
