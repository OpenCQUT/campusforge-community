import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { ApplicationRepository } from "../repositories/application-repository.js";
import {
  ApplicationConflictError,
  ApplicationNotFoundError,
  ApplicationReviewError,
} from "../repositories/mock-application-repository.js";

const createApplicationBody = z.object({
  schoolEmail: z.string().email(),
  studentId: z.string().min(1),
  department: z.string().min(1),
  reason: z.string().min(10).max(1000),
});

const reviewApplicationBody = z.object({
  status: z.enum(["APPROVED", "REJECTED", "NEEDS_INFO"]),
  reviewReason: z.string().max(1000).optional(),
});

export function createApplicationRoutes(
  repository: ApplicationRepository,
): FastifyPluginAsync {
  return async (app) => {
    // Submit an invitation application
    app.post("/applications", async (request, reply) => {
      const userId = request.headers["x-user-id"];
      if (typeof userId !== "string" || userId.length === 0) {
        return reply.status(400).send({
          error: "Missing x-user-id header",
        });
      }

      const parsed = createApplicationBody.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Invalid request body",
          details: parsed.error.flatten().fieldErrors,
        });
      }

      try {
        const application = await repository.create({
          userId,
          ...parsed.data,
        });
        return reply.status(201).send(application);
      } catch (error) {
        if (error instanceof ApplicationConflictError) {
          return reply.status(409).send({ error: error.message });
        }
        throw error;
      }
    });

    // Get own application
    app.get("/applications/me", async (request, reply) => {
      const userId = request.headers["x-user-id"];
      if (typeof userId !== "string" || userId.length === 0) {
        return reply.status(400).send({
          error: "Missing x-user-id header",
        });
      }

      const application = await repository.findByUserId(userId);
      if (!application) {
        return reply.status(404).send({ error: "No application found" });
      }
      return reply.send(application);
    });

    // Get application by ID
    app.get<{ Params: { id: string } }>(
      "/applications/:id",
      async (request, reply) => {
        const application = await repository.findById(request.params.id);
        if (!application) {
          return reply.status(404).send({ error: "Application not found" });
        }
        return reply.send(application);
      },
    );

    // List all applications (admin)
    app.get("/applications", async (_request, reply) => {
      const applications = await repository.list();
      return reply.send({ items: applications, total: applications.length });
    });

    // Review an application (admin)
    app.patch<{ Params: { id: string } }>(
      "/applications/:id/review",
      async (request, reply) => {
        const reviewerId = request.headers["x-user-id"];
        if (typeof reviewerId !== "string" || reviewerId.length === 0) {
          return reply.status(400).send({
            error: "Missing x-user-id header",
          });
        }

        const parsed = reviewApplicationBody.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
          });
        }

        try {
          const application = await repository.review(request.params.id, {
            ...parsed.data,
            reviewerId,
          });
          return reply.send(application);
        } catch (error) {
          if (error instanceof ApplicationNotFoundError) {
            return reply.status(404).send({ error: error.message });
          }
          if (error instanceof ApplicationReviewError) {
            return reply.status(409).send({ error: error.message });
          }
          throw error;
        }
      },
    );
  };
}
