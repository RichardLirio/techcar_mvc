import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomUUID } from "crypto";

const schemaId = `test_${randomUUID()}`; // Gerando schema unico

function generateTestDatabaseUrl(schema: string): string {
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set("schema", schema);
  return url.toString(); // gera toda a url para conectar ao banco de dados
}

export const databaseUrl = generateTestDatabaseUrl(schemaId);
process.env.DATABASE_URL = databaseUrl;

let prisma: PrismaClient;

export async function setupTestDatabase() {
  // Conecta ao banco para criar o schema
  // Configura Prisma com o banco de teste

  prisma = new PrismaClient();

  await prisma.$connect();
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`);
  await prisma.$disconnect();

  // Roda as migrações
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
}

export async function cleanupTestDatabase() {
  prisma = new PrismaClient();

  await prisma.$connect();
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`);
  await prisma.$disconnect();
}
