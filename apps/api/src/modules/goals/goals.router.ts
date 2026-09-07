import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createGoalSchema,
  goalIdParamsSchema,
  listGoalsQuerySchema,
  updateGoalSchema,
  type CreateGoalInput,
  type ListGoalsQuery,
  type UpdateGoalInput
} from "./goals.schema";
import { goalsService } from "./goals.service";

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }
  return request.user.id;
}

function paramId(request: Request): string {
  const id = request.params.id;
  if (!id) {
    throw new Error("Goal id is required");
  }
  return id;
}

export const goalsRouter = Router();

goalsRouter.use(authMiddleware);

goalsRouter.get(
  "/",
  validate({ query: listGoalsQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await goalsService.list(userId(request), request.query as unknown as ListGoalsQuery);
    response.json({ success: true, data });
  })
);

goalsRouter.post(
  "/",
  validate({ body: createGoalSchema }),
  asyncHandler(async (request, response) => {
    const data = await goalsService.create(userId(request), request.body as CreateGoalInput);
    response.status(201).json({ success: true, data });
  })
);

goalsRouter.put(
  "/:id",
  validate({ params: goalIdParamsSchema, body: updateGoalSchema }),
  asyncHandler(async (request, response) => {
    const data = await goalsService.update(userId(request), paramId(request), request.body as UpdateGoalInput);
    response.json({ success: true, data });
  })
);

goalsRouter.delete(
  "/:id",
  validate({ params: goalIdParamsSchema }),
  asyncHandler(async (request, response) => {
    const data = await goalsService.delete(userId(request), paramId(request));
    response.json({ success: true, data });
  })
);
