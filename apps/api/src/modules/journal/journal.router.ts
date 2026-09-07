import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  calendarJournalQuerySchema,
  createJournalSchema,
  journalIdParamsSchema,
  journalMediaParamsSchema,
  listJournalQuerySchema,
  mediaJournalSchema,
  searchJournalQuerySchema,
  updateJournalSchema,
  type CalendarJournalQuery,
  type CreateJournalInput,
  type ListJournalQuery,
  type MediaJournalInput,
  type SearchJournalQuery,
  type UpdateJournalInput
} from "./journal.schema";
import { journalService } from "./journal.service";

type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void> | void;

function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function currentUserId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

function paramId(request: Request): string {
  const id = request.params.id;

  if (!id) {
    throw new Error("Journal id is required");
  }

  return id;
}

export const journalRouter = Router();

journalRouter.use(authMiddleware);

journalRouter.get(
  "/",
  validate({ query: listJournalQuerySchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.list(
      currentUserId(request),
      request.query as unknown as ListJournalQuery,
      request.db
    );

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.post(
  "/",
  validate({ body: createJournalSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.create(currentUserId(request), request.body as CreateJournalInput);

    response.status(201).json({
      success: true,
      data
    });
  })
);

journalRouter.get(
  "/search",
  validate({ query: searchJournalQuerySchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.search(
      currentUserId(request),
      request.query as unknown as SearchJournalQuery
    );

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.get(
  "/calendar",
  validate({ query: calendarJournalQuerySchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.calendar(
      currentUserId(request),
      request.query as unknown as CalendarJournalQuery
    );

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.get(
  "/:id",
  validate({ params: journalIdParamsSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.get(currentUserId(request), paramId(request), request.db);

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.put(
  "/:id",
  validate({ params: journalIdParamsSchema, body: updateJournalSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.update(
      currentUserId(request),
      paramId(request),
      request.body as UpdateJournalInput
    );

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.delete(
  "/:id",
  validate({ params: journalIdParamsSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.delete(currentUserId(request), paramId(request));

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.post(
  "/:id/media",
  validate({ params: journalIdParamsSchema, body: mediaJournalSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.createMediaUpload(
      currentUserId(request),
      paramId(request),
      request.body as MediaJournalInput
    );

    response.status(201).json({
      success: true,
      data
    });
  })
);

journalRouter.get(
  "/:id/media",
  validate({ params: journalIdParamsSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await journalService.listMedia(currentUserId(request), paramId(request));

    response.json({
      success: true,
      data
    });
  })
);

journalRouter.delete(
  "/:id/media/:mediaId",
  validate({ params: journalMediaParamsSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const mediaId = request.params.mediaId;
    if (!mediaId) {
      throw new Error("Media id is required");
    }

    const data = await journalService.deleteMedia(currentUserId(request), paramId(request), mediaId);

    response.json({
      success: true,
      data
    });
  })
);
