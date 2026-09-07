import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { exportLimiter } from "../../middleware/rateLimit";
import { validate } from "../../middleware/validate";
import {
  deleteAccountSchema,
  updatePasswordSchema,
  updateProfileSchema,
  type DeleteAccountInput,
  type UpdatePasswordInput,
  type UpdateProfileInput
} from "./user.schema";
import { userService } from "./user.service";

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

function bearerToken(request: Request): string {
  const header = request.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    throw new Error("Access token is required");
  }

  return token;
}

export const userRouter = Router();

userRouter.use(authMiddleware);

userRouter.put(
  "/profile",
  validate({ body: updateProfileSchema }),
  asyncHandler(async (request, response) => {
    const data = await userService.updateProfile(userId(request), request.body as UpdateProfileInput);
    response.json({ success: true, data });
  })
);

userRouter.put(
  "/password",
  validate({ body: updatePasswordSchema }),
  asyncHandler(async (request, response) => {
    const data = await userService.updatePassword(
      userId(request),
      request.body as UpdatePasswordInput,
      bearerToken(request)
    );
    response.json({ success: true, data });
  })
);

userRouter.post(
  "/export",
  exportLimiter,
  asyncHandler(async (request, response) => {
    const data = await userService.exportData(userId(request));
    response.json({ success: true, data });
  })
);

userRouter.delete(
  "/account",
  validate({ body: deleteAccountSchema }),
  asyncHandler(async (request, response) => {
    const data = await userService.deleteAccount(
      userId(request),
      request.body as DeleteAccountInput,
      bearerToken(request)
    );
    response.json({ success: true, data });
  })
);
