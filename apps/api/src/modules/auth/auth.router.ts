import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { authLimiter, registerLimiter } from "../../middleware/rateLimit";
import { validateBody } from "../../middleware/validate";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  type LoginInput,
  type LogoutInput,
  type RefreshInput,
  type RegisterInput
} from "./auth.schema";
import { authService } from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  registerLimiter,
  validateBody(registerSchema),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await authService.register(request.body as RegisterInput);

    response.status(201).json({
      success: true,
      data
    });
  })
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await authService.login(request.body as LoginInput);

    response.json({
      success: true,
      data
    });
  })
);

authRouter.post(
  "/refresh",
  validateBody(refreshSchema),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await authService.refresh(request.body as RefreshInput);

    response.json({
      success: true,
      data
    });
  })
);

authRouter.post(
  "/logout",
  validateBody(logoutSchema),
  asyncHandler(async (request: Request, response: Response) => {
    const data = await authService.logout(request.body as LogoutInput);

    response.json({
      success: true,
      data
    });
  })
);

authRouter.get(
  "/me",
  authMiddleware,
  asyncHandler(async (request: Request, response: Response) => {
    if (!request.user) {
      response.status(401).json({
        success: false,
        error: "Unauthorized"
      });
      return;
    }

    const data = await authService.me(request.user.id);

    response.json({
      success: true,
      data
    });
  })
);
