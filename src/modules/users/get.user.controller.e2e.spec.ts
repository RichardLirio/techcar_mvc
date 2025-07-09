import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

describe("Get User Controller (e2e)", async () => {
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

  it("should be able to get user profile", async () => {
    const cookies = await geraCookies();
    const user = await prisma.user.create({
      data: {
        name: "John doe",
        email: "johndoe@example.com",
        password: "123456",
      },
    });

    const response = await request(application.server)
      .get(`/api/v1/users/${user.id}`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          id: expect.any(String),
          name: "John doe",
          email: "johndoe@example.com",
        }),
      })
    );
  });

  it("should not to be able to get user profile with invalid id", async () => {
    const cookies = await geraCookies();

    const response = await request(application.server)
      .get(`/api/v1/users/invalid-id`) // buscar pelo id do usuario
      .set("Cookie", cookies);

    expect(response.statusCode).toEqual(404);
  });
});
