import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./utils/hash-password";
import { env } from "@/env";
const prisma = new PrismaClient();

export async function seed() {
  try {
    const userAdminExist = await prisma.user.findUnique({
      where: {
        email: env.ADMIN_USER_EMAIL,
      },
    });
    if (!userAdminExist) {
      const admin = await prisma.user.create({
        data: {
          name: "Admin User",
          email: env.ADMIN_USER_EMAIL,
          password: await hashPassword(env.ADMIN_USER_PASSWORD),
          role: "ADMIN",
        },
      });

      console.log({ admin }, "Admin User created succesfuly");
    } else {
      console.log({ userAdminExist }, "Admin User already exists");
    }
  } catch (error) {
    console.error("Erro ao criar usuário padrão:", error);
  } finally {
    await prisma.$disconnect();
  }
}
