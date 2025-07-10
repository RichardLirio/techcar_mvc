import { FastifyInstance } from "fastify";
import request from "supertest";

export async function geraCookies(
  role: "USER" | "ADMIN",
  app: FastifyInstance
) {
  if (role == "ADMIN") {
    const loginResponse = await request(app.server).post("/api/v1/login").send({
      email: "admin@admin.com",
      password: "123456",
    });

    const cookies = loginResponse.headers["set-cookie"];

    if (!cookies) {
      throw new Error("Cookie não encontrado após login");
    }

    return cookies;
  }

  const loginResponse = await request(app.server).post("/api/v1/login").send({
    email: "user@user.com",
    password: "123456",
  });

  const cookies = loginResponse.headers["set-cookie"];

  if (!cookies) {
    throw new Error("Cookie não encontrado após login");
  }

  return cookies;
}
