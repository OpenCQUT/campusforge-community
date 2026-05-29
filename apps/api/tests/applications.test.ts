import { describe, expect, it, beforeEach } from "vitest";
import { buildApp } from "../src/app";

const env = {
  NODE_ENV: "test" as const,
  API_PORT: 4000,
  CORS_ORIGIN: "http://localhost:3000",
  REPOSITORY_MODE: "mock" as const,
};

const validBody = {
  schoolEmail: "student@school.edu",
  studentId: "2024001",
  department: "Computer Science",
  reason: "I want to join the open-source community to learn and contribute.",
};

describe("applications", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp(env);
    return () => app.close();
  });

  it("creates an application", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.status).toBe("SUBMITTED");
    expect(body.schoolEmail).toBe("student@school.edu");
    expect(body.userId).toBe("user-1");
    expect(body.id).toBeDefined();
  });

  it("rejects duplicate applications", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error).toContain("already has an application");
  });

  it("returns 400 without x-user-id header", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/applications",
      payload: validBody,
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for invalid body", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: { schoolEmail: "not-an-email" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("gets own application", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/applications/me",
      headers: { "x-user-id": "user-1" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().userId).toBe("user-1");
  });

  it("returns 404 when no application exists for user", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/applications/me",
      headers: { "x-user-id": "nobody" },
    });

    expect(response.statusCode).toBe(404);
  });

  it("lists applications", async () => {
    await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/applications",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
  });

  it("reviews an application", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/v1/applications",
      headers: { "x-user-id": "user-1" },
      payload: validBody,
    });
    const { id } = createResponse.json();

    const response = await app.inject({
      method: "PATCH",
      url: `/v1/applications/${id}/review`,
      headers: { "x-user-id": "admin-1" },
      payload: { status: "APPROVED", reviewReason: "Welcome!" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe("APPROVED");
    expect(response.json().reviewerId).toBe("admin-1");
    expect(response.json().reviewReason).toBe("Welcome!");
  });

  it("returns 404 when reviewing nonexistent application", async () => {
    const response = await app.inject({
      method: "PATCH",
      url: "/v1/applications/nonexistent/review",
      headers: { "x-user-id": "admin-1" },
      payload: { status: "APPROVED" },
    });

    expect(response.statusCode).toBe(404);
  });
});
