import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Create User Controller (e2e)", async () => {
  let application: FastifyInstance;
  beforeAll(async () => {
    application = await buildApp();
    application.ready();
    await setupTestDatabase();
    prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@admin.com",
        password: await hashPassword("123456"),
        role: "ADMIN",
      },
    });
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  async function geraCookies() {
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

  it("should be able to create user", async () => {
    const cookies = await geraCookies();

    const response = await request(application.server)
      .post("/api/v1/users")
      .set("Cookie", cookies)
      .send({
        name: "John doe",
        email: "johndoe@example.com",
        password: "123456",
      });
    expect(response.statusCode).toEqual(201);
  });

  it("should be not able to create user with same email", async () => {
    const cookies = await geraCookies();
    const response = await request(application.server)
      .post("/api/v1/users")
      .set("Cookie", cookies)
      .send({
        name: "John doe",
        email: "admin@admin.com",
        password: "123456",
      });
    expect(response.statusCode).toEqual(400); // erro de retorno
  });
});
