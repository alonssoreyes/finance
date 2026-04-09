import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url()
});

export const env = envSchema.parse({
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/gastosapp?schema=public",
  DIRECT_URL: process.env.DIRECT_URL,
  AUTH_SECRET:
    process.env.AUTH_SECRET ?? "change-this-auth-secret-before-production-use",
  APP_URL: process.env.APP_URL ?? "http://localhost:3000"
});
