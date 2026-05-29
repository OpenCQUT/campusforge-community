import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import type { ApiEnv } from "./env";
import { MockApplicationRepository } from "./repositories/mock-application-repository";
import { createApplicationRoutes } from "./routes/applications";
import { registerHealthRoutes } from "./routes/health";

export async function buildApp(env: ApiEnv) {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  const applicationRepository = new MockApplicationRepository();

  await app.register(registerHealthRoutes, { prefix: "/v1" });
  await app.register(createApplicationRoutes(applicationRepository), {
    prefix: "/v1",
  });

  return app;
}
