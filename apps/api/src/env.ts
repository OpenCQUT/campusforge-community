import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function loadEnv() {
  return envSchema.parse(process.env);
}
