import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupTestDatabase, setupTestDatabase } from "test/e2e-setup";
import { buildApp } from "@/app";
import { FastifyInstance } from "fastify";
import { geraCookies } from "test/factories/return-auth-cookies";
import { CreateUserForTests } from "test/factories/create-users-for-tests";

describe("Create User Controller (e2e)", async () => {
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

  it("should be able to create user", async () => {
    const cookies = await geraCookies("ADMIN", application);

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
    const cookies = await geraCookies("ADMIN", application);
    const response = await request(application.server)
      .post("/api/v1/users")
      .set("Cookie", cookies)
      .send({
        name: "John doe",
        email: "johndoe@example.com",
        password: "123456",
      });
    expect(response.statusCode).toEqual(409); // erro de retorno
  });
});
