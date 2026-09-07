import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { authMiddleware } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { supabaseAdmin } from "../../config/supabase";
import { upsertDailyLogSchema, type UpsertDailyLogInput } from "./daily-log.schema";

function userId(request: Request): string {
  if (!request.user) {
    throw new Error("Authenticated user is required");
  }

  return request.user.id;
}

export const dailyLogRouter = Router();

dailyLogRouter.use(authMiddleware);

/** Upsert a daily check-in (Insights mood trend; not used by Today). */
dailyLogRouter.put(
  "/",
  validate({ body: upsertDailyLogSchema }),
  asyncHandler(async (request: Request, response: Response) => {
    const input = request.body as UpsertDailyLogInput;
    const uid = userId(request);

    const { data, error } = await supabaseAdmin
      .from("daily_logs")
      .upsert(
        {
          user_id: uid,
          log_date: input.date,
          mood: input.mood,
          energy: input.energy,
          anxiety: input.anxiety ?? null,
          notes: input.notes ?? null,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,log_date" }
      )
      .select("log_date,mood,energy,anxiety,notes")
      .single();

    if (error) {
      throw error;
    }

    response.json({
      success: true,
      data: {
        date: data.log_date,
        mood: data.mood,
        energy: data.energy,
        anxiety: data.anxiety,
        notes: data.notes
      }
    });
  })
);
