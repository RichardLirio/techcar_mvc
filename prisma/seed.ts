import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/hash-password";
import { env } from "@/env";
const prisma = new PrismaClient();
async function main() {
  const userAdminExist = await prisma.user.findUnique({
    where: {
      email: "admin@example.com",
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
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
