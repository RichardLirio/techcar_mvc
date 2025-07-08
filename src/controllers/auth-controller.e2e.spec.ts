import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Authenticate User (e2e)", async () => {
  let application: FastifyInstance;

  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  it("should be able to authenticate", async () => {
    await prisma.user.create({
      data: {
        name: "John Doe",
        email: "johndoe@example.com",
        password: await hashPassword("123456"),
      },
    });
    const response = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "johndoe@example.com",
        password: "123456",
      });
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual({
      token: expect.any(String),
    });
  });
});
