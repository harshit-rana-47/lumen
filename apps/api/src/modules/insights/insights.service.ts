import { WORKER_MODEL, groqClient } from "../../config/groq";
import { redis } from "../../config/redis";
import { supabaseAdmin } from "../../config/supabase";
import { decrypt, encrypt, type EncryptedPayload } from "../../lib/encrypt";
import { getUserDEK } from "../../lib/userDEK";
import type { InsightsListQuery, MoodTrendQuery, ReportQuery } from "./insights.schema";

type InsightRow = {
  id: string;
  insight_type: string;
  summary_encrypted: string;
  iv: string;
  auth_tag: string;
  period_start: string | null;
  period_end: string | null;
  confidence: number | null;
  is_dismissed: boolean | null;
  seen_at: string | null;
  created_at: string;
};

type DailyLogRow = {
  log_date: string;
  mood: number | null;
  energy: number | null;
  anxiety: number | null;
};

const INSIGHT_SELECT =
  "id,insight_type,summary_encrypted,iv,auth_tag,period_start,period_end,confidence,is_dismissed,seen_at,created_at";

function daysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function decryptInsight(row: InsightRow, dek: string) {
  return {
    id: row.id,
    type: row.insight_type,
    summary: decrypt(
      {
        ciphertext: row.summary_encrypted,
        iv: row.iv,
        authTag: row.auth_tag
      },
      dek
    ),
    periodStart: row.period_start,
    periodEnd: row.period_end,
    confidence: row.confidence,
    isDismissed: row.is_dismissed ?? false,
    seenAt: row.seen_at,
    createdAt: row.created_at
  };
}

function cacheKey(userId: string, period: string): string {
  return `lumen:insights:report:${userId}:${period}`;
}

export class InsightsService {
  async list(userId: string, query: InsightsListQuery) {
    const dek = await getUserDEK(userId);
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    const { data, error, count } = await supabaseAdmin
      .from("insights")
      .select(INSIGHT_SELECT, { count: "exact" })
      .eq("user_id", userId)
      .order("is_dismissed", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<InsightRow[]>();

    if (error) {
      throw error;
    }

    return {
      insights: (data ?? []).map((row) => decryptInsight(row, dek)),
      page: query.page,
      limit: query.limit,
      total: count ?? 0
    };
  }

  async dismiss(userId: string, id: string) {
    const { data, error } = await supabaseAdmin
      .from("insights")
      .update({
        is_dismissed: true,
        seen_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select("id,is_dismissed,seen_at")
      .single<{ id: string; is_dismissed: boolean; seen_at: string | null }>();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      isDismissed: data.is_dismissed,
      seenAt: data.seen_at
    };
  }

  async moodTrend(userId: string, query: MoodTrendQuery) {
    const { data, error } = await supabaseAdmin
      .from("daily_logs")
      .select("log_date,mood,energy,anxiety")
      .eq("user_id", userId)
      .gte("log_date", daysAgo(query.days))
      .order("log_date", { ascending: true })
      .returns<DailyLogRow[]>();

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      date: row.log_date,
      mood: row.mood,
      energy: row.energy,
      anxiety: row.anxiety
    }));
  }

  async report(userId: string, query: ReportQuery) {
    const dek = await getUserDEK(userId);
    const key = cacheKey(userId, query.period);
    const cached = await redis.get(key);

    if (typeof cached === "string") {
      const encrypted = JSON.parse(cached) as EncryptedPayload;
      return {
        period: query.period,
        report: decrypt(encrypted, dek),
        cached: true
      };
    }

    const [trend, insights] = await Promise.all([
      this.moodTrend(userId, { days: query.period === "week" ? 7 : query.period === "month" ? 30 : 90 }),
      this.list(userId, { page: 1, limit: 10 })
    ]);

    const completion = await groqClient.chat.completions.create({
      model: WORKER_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Write a concise reflective wellness report from the provided trend data and insights. Do not diagnose. Be practical, warm, and specific."
        },
        {
          role: "user",
          content: JSON.stringify({
            period: query.period,
            moodTrend: trend,
            insights: insights.insights.map((insight) => ({
              type: insight.type,
              summary: insight.summary,
              confidence: insight.confidence
            }))
          })
        }
      ]
    });

    const report = completion.choices[0]?.message.content?.trim() ?? "";
    const encrypted = encrypt(report, dek);

    await redis.set(key, JSON.stringify(encrypted), "EX", 24 * 60 * 60);

    return {
      period: query.period,
      report,
      cached: false
    };
  }
}

export const insightsService = new InsightsService();
