import { env } from "@/env";
import { PrismaClient } from "@prisma/client";

export const prisma: PrismaClient = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query"] : [],
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
