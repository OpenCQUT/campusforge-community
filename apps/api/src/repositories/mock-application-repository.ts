import { randomUUID } from "node:crypto";
import type {
  Application,
  ApplicationRepository,
  CreateApplicationInput,
  ReviewApplicationInput,
} from "./application-repository.js";

export class MockApplicationRepository implements ApplicationRepository {
  private readonly store = new Map<string, Application>();

  async create(input: CreateApplicationInput): Promise<Application> {
    const existing = this.findByUserIdSync(input.userId);
    if (existing) {
      throw new ApplicationConflictError(input.userId);
    }

    const now = new Date();
    const application: Application = {
      id: randomUUID(),
      userId: input.userId,
      schoolEmail: input.schoolEmail,
      studentId: input.studentId,
      department: input.department,
      reason: input.reason,
      status: "SUBMITTED",
      reviewerId: null,
      reviewReason: null,
      reviewedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.store.set(application.id, application);
    return application;
  }

  async findById(id: string): Promise<Application | null> {
    return this.store.get(id) ?? null;
  }

  async findByUserId(userId: string): Promise<Application | null> {
    return this.findByUserIdSync(userId);
  }

  async list(): Promise<Application[]> {
    return [...this.store.values()].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async review(
    id: string,
    input: ReviewApplicationInput,
  ): Promise<Application> {
    const application = this.store.get(id);
    if (!application) {
      throw new ApplicationNotFoundError(id);
    }

    if (application.status !== "SUBMITTED" && application.status !== "UNDER_REVIEW" && application.status !== "NEEDS_INFO") {
      throw new ApplicationReviewError(
        `Cannot review application in status ${application.status}`,
      );
    }

    const updated: Application = {
      ...application,
      status: input.status,
      reviewerId: input.reviewerId,
      reviewReason: input.reviewReason ?? null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    };

    this.store.set(id, updated);
    return updated;
  }

  private findByUserIdSync(userId: string): Application | null {
    for (const app of this.store.values()) {
      if (app.userId === userId) return app;
    }
    return null;
  }
}

export class ApplicationConflictError extends Error {
  constructor(userId: string) {
    super(`User ${userId} already has an application`);
    this.name = "ApplicationConflictError";
  }
}

export class ApplicationNotFoundError extends Error {
  constructor(id: string) {
    super(`Application ${id} not found`);
    this.name = "ApplicationNotFoundError";
  }
}

export class ApplicationReviewError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApplicationReviewError";
  }
}
