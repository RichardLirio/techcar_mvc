import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Delete User Controller (e2e)", async () => {
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

  it("should be able to delete user", async () => {
    const cookies = await geraCookies("ADMIN", application);

    const user = await prisma.user.create({
      data: {
        name: "John doe",
        email: "johndoe@example.com",
        password: "123456",
      },
    });

    const response = await request(application.server)
      .delete(`/api/v1/users/${user.id}`) //pelo id do usuario
      .set("Cookie", cookies);
    expect(response.statusCode).toEqual(204);

    const userExist = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(userExist).toBeNull();
  });
});
