import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createMemorySchema,
  listMemoryQuerySchema,
  memoryIdParamsSchema,
  memorySettingsSchema,
  updateMemorySchema,
  type CreateMemoryInput,
  type ListMemoryQuery,
  type MemorySettingsInput,
  type UpdateMemoryInput
} from "./memory.schema";
import { memoryService } from "./memory.service";

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

function paramId(request: Request): string {
  const id = request.params.id;
  if (!id) {
    throw new Error("Memory id is required");
  }
  return id;
}

export const memoryRouter = Router();

memoryRouter.use(authMiddleware);

memoryRouter.get(
  "/",
  validate({ query: listMemoryQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.list(userId(request), request.query as unknown as ListMemoryQuery);
    response.json({ success: true, data });
  })
);

memoryRouter.post(
  "/",
  validate({ body: createMemorySchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.create(userId(request), request.body as CreateMemoryInput);
    response.status(201).json({ success: true, data });
  })
);

memoryRouter.get(
  "/graph",
  asyncHandler(async (request, response) => {
    const data = await memoryService.graph(userId(request));
    response.json({ success: true, data });
  })
);

memoryRouter.get(
  "/settings",
  asyncHandler(async (request, response) => {
    const data = await memoryService.settings(userId(request));
    response.json({ success: true, data });
  })
);

memoryRouter.put(
  "/settings",
  validate({ body: memorySettingsSchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.updateSettings(userId(request), request.body as MemorySettingsInput);
    response.json({ success: true, data });
  })
);

memoryRouter.put(
  "/:id",
  validate({ params: memoryIdParamsSchema, body: updateMemorySchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.update(
      userId(request),
      paramId(request),
      request.body as UpdateMemoryInput
    );
    response.json({ success: true, data });
  })
);

memoryRouter.delete(
  "/:id",
  validate({ params: memoryIdParamsSchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.delete(userId(request), paramId(request));
    response.json({ success: true, data });
  })
);

memoryRouter.post(
  "/:id/confirm",
  validate({ params: memoryIdParamsSchema }),
  asyncHandler(async (request, response) => {
    const data = await memoryService.confirm(userId(request), paramId(request));
    response.json({ success: true, data });
  })
);
