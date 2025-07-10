import { prisma } from "@/lib/database";
import { hashPassword } from "@/utils/hash-password";

export async function CreateUserForTests() {
  await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@admin.com",
      password: await hashPassword("123456"),
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      name: "User",
      email: "user@user.com",
      password: await hashPassword("123456"),
      role: "USER",
    },
  });
}
