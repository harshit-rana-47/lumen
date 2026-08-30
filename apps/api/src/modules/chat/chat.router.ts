import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { authMiddleware } from "../../middleware/auth";
import { chatLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import {
  chatSessionIdParamsSchema,
  createChatSessionSchema,
  listChatMessagesQuerySchema,
  sendChatMessageSchema,
  type CreateChatSessionInput,
  type ListChatMessagesQuery,
  type SendChatMessageInput
} from "./chat.schema";
import { chatService } from "./chat.service";

type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void> | void;

function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

function sessionId(request: Request): string {
  const id = request.params.id;
  if (!id) {
    throw new Error("Chat session id is required");
  }
  return id;
}

export const chatRouter = Router();

chatRouter.use(authMiddleware);

chatRouter.get(
  "/sessions",
  asyncHandler(async (request, response) => {
    const data = await chatService.listSessions(userId(request));
    response.json({ success: true, data });
  })
);

chatRouter.post(
  "/sessions",
  validate({ body: createChatSessionSchema }),
  asyncHandler(async (request, response) => {
    const data = await chatService.createSession(userId(request), request.body as CreateChatSessionInput);
    response.status(201).json({ success: true, data });
  })
);

chatRouter.delete(
  "/sessions/:id",
  validate({ params: chatSessionIdParamsSchema }),
  asyncHandler(async (request, response) => {
    const data = await chatService.deleteSession(userId(request), sessionId(request));
    response.json({ success: true, data });
  })
);

chatRouter.get(
  "/sessions/:id/messages",
  validate({ params: chatSessionIdParamsSchema, query: listChatMessagesQuerySchema }),
  asyncHandler(async (request, response) => {
    const data = await chatService.listMessages(
      userId(request),
      sessionId(request),
      request.query as unknown as ListChatMessagesQuery
    );
    response.json({ success: true, data });
  })
);

chatRouter.post(
  "/sessions/:id/message",
  chatLimiter,
  validate({ params: chatSessionIdParamsSchema, body: sendChatMessageSchema }),
  asyncHandler(async (request, response) => {
    await chatService.streamMessage(
      userId(request),
      sessionId(request),
      request.body as SendChatMessageInput,
      response
    );
  })
);
