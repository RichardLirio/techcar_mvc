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
    await prisma.user.create({
      data: {
        name: "John Doe",
        email: "johndoe@example.com",
        password: await hashPassword("123456"),
      },
    });
  });

  afterAll(async () => {
    await application.close();
    await cleanupTestDatabase();
  });

  it("should be able to authenticate", async () => {
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

  it("should be not able to authenticate user with no register email", async () => {
    const response = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "johndoinvalid@example.com",
        password: "123456",
      });
    expect(response.statusCode).toEqual(401);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual("Email não registrado");
  });

  it("should be not able to authenticate user with invalid credentials", async () => {
    const response = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "johndoe@example.com",
        password: "123458",
      });
    expect(response.statusCode).toEqual(401);
    expect(response.body.success).toEqual(false);
    expect(response.body.error).toEqual("Credenciais inválidas");
  });

  it("should successfully logout the authenticated user", async () => {
    const loginResponse = await request(application.server)
      .post("/api/v1/login")
      .send({
        email: "johndoe@example.com",
        password: "123456",
      });

    const cookies = loginResponse.headers["set-cookie"];
    expect(cookies).toBeDefined();

    if (!cookies) {
      throw new Error("Cookie não encontrado após login");
    }

    // Primeiro, verifica se a rota protegida está acessível COM o cookie
    const protectedBeforeLogout = await request(application.server)
      .get("/api/v1/profile")
      .set("Cookie", cookies);

    expect(protectedBeforeLogout.statusCode).toBe(200); // Deve funcionar antes do logout

    // Faz logout
    const logoutResponse = await request(application.server)
      .post("/api/v1/logout")
      .set("Cookie", cookies);

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toEqual({
      message: "Logout realizado com sucesso",
      success: true,
    });

    // Agora usa o cookie que foi retornado no logout (que deve estar limpo/invalidado)
    const logoutCookies = logoutResponse.headers["set-cookie"];

    // Tenta acessar rota protegida com o cookie invalidado
    const protectedAfterLogout = await request(application.server)
      .get("/api/v1/profile")
      .set("Cookie", logoutCookies || cookies); // usa o cookie limpo se disponível

    expect(protectedAfterLogout.statusCode).toEqual(401);
  });

  // Teste separado para verificar acesso negado sem cookie
  it("should not be able to access protected route without cookie", async () => {
    const protectedResponse = await request(application.server).get(
      "/api/v1/profile"
    );

    expect(protectedResponse.statusCode).toEqual(401);
  });
});
