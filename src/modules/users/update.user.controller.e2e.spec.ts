import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";
import { CreateUserForTests } from "test/factories/create-users-for-tests";
import { geraCookies } from "test/factories/return-auth-cookies";

describe("Update User Controller (e2e)", async () => {
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

  it("should be able to update user", async () => {
    const cookies = await geraCookies("ADMIN", application);
    const user = await prisma.user.create({
      data: {
        name: "John Doe",
        email: "johndoe@example.com",
        password: await hashPassword("123456"),
      },
    });

    const response = await request(application.server)
      .patch(`/api/v1/users/${user.id}`) //pelo id do usuario
      .set("Cookie", cookies)
      .send({
        name: "John Doe updated",
        email: "johndoeupdated@example.com",
        password: "789654",
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        userUpdated: expect.objectContaining({
          id: expect.any(String),
          name: "JOHN DOE UPDATED",
          email: "johndoeupdated@example.com",
        }),
      })
    );
  });
});
