import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CORS_ORIGINS: z.string(),
  APP_VERSION: z.string(),
  RATE_LIMIT_MAX: z.coerce.number(),
  HOST: z.string().default("localhost"),
  ADMIN_USER_EMAIL: z.string(),
  ADMIN_USER_PASSWORD: z.string().min(6),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Invalid environment variables", _env.error.format());

  throw new Error("Invalid environment variables");
}

export const env = _env.data;
