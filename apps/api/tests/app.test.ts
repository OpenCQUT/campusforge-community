import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app";

const env = {
  NODE_ENV: "test" as const,
  API_PORT: 4000,
  CORS_ORIGIN: "http://localhost:3000",
  REPOSITORY_MODE: "mock" as const,
};

describe("api", () => {
  it("responds to health checks", async () => {
    const app = await buildApp(env);
    const response = await app.inject({ method: "GET", url: "/v1/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("ok");
    await app.close();
  });
});
