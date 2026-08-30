import { Worker, type Job } from "bullmq";
import { groqClient, WORKER_MODEL } from "../config/groq";
import { supabaseAdmin } from "../config/supabase";
import { encrypt } from "../lib/encrypt";
import { insightQueue, queueNames } from "../lib/queue";
import { getUserDEK } from "../lib/userDEK";
import { stripJsonMarkdownFences, workerOptions } from "./worker.shared";

type InsightJobData = {
  userId?: string;
};

type UserRow = {
  id: string;
};

type MoodRow = {
  entry_date: string;
  mood_score: number | null;
};

type GeneratedInsight = {
  summary: string;
  confidence: number;
  insightType: "mood_pattern" | "growth" | "warning" | "milestone";
};

function thirtyDaysAgo(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10);
}

function sevenDayRollingAverage(rows: MoodRow[]): number | undefined {
  const scores = rows
    .filter((row) => row.mood_score !== null)
    .slice(-7)
    .map((row) => row.mood_score as number);

  if (scores.length === 0) {
    return undefined;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function parseInsight(raw: string): GeneratedInsight {
  const parsed = JSON.parse(stripJsonMarkdownFences(raw)) as Partial<GeneratedInsight>;

  if (!parsed.summary || typeof parsed.summary !== "string") {
    throw new Error("Insight response did not include a summary");
  }

  const confidence =
    typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
      ? Math.min(1, Math.max(0, parsed.confidence))
      : 0.75;

  const insightType = parsed.insightType ?? "mood_pattern";

  return {
    summary: parsed.summary,
    confidence,
    insightType
  };
}

async function getUsersForInsight(userId?: string): Promise<UserRow[]> {
  if (userId) {
    return [{ id: userId }];
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .is("deleted_at", null)
    .returns<UserRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function getMoodRows(userId: string): Promise<MoodRow[]> {
  const { data, error } = await supabaseAdmin
    .from("journal_entries")
    .select("entry_date,mood_score")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .not("mood_score", "is", null)
    .gte("entry_date", thirtyDaysAgo())
    .order("entry_date", { ascending: true })
    .returns<MoodRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function generateInsight(rows: MoodRow[]): Promise<GeneratedInsight | undefined> {
  const rollingAverage = sevenDayRollingAverage(rows);

  if (rollingAverage === undefined || rows.length < 5) {
    return undefined;
  }

  const completion = await groqClient.chat.completions.create({
    model: WORKER_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Analyze rolling mood data and return ONLY JSON: {summary, confidence, insightType}. insightType must be mood_pattern, growth, warning, or milestone. No markdown, no explanation."
      },
      {
        role: "user",
        content: JSON.stringify({
          rollingAverage7Day: rollingAverage,
          moodSeries: rows.map((row) => ({
            date: row.entry_date,
            moodScore: row.mood_score
          }))
        })
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    return undefined;
  }

  const insight = parseInsight(raw);

  return insight.confidence >= 0.7 ? insight : undefined;
}

async function insertInsight(userId: string, insight: GeneratedInsight): Promise<void> {
  const dek = await getUserDEK(userId);
  const encryptedSummary = encrypt(insight.summary, dek);
  const periodEnd = new Date().toISOString().slice(0, 10);

  const { error } = await supabaseAdmin.from("insights").insert({
    user_id: userId,
    insight_type: insight.insightType,
    summary_encrypted: encryptedSummary.ciphertext,
    iv: encryptedSummary.iv,
    auth_tag: encryptedSummary.authTag,
    period_start: thirtyDaysAgo(),
    period_end: periodEnd,
    confidence: insight.confidence
  });

  if (error) {
    throw error;
  }
}

export async function processInsightJob(data: InsightJobData = {}): Promise<void> {
  const users = await getUsersForInsight(data.userId);

  for (const user of users) {
    const moodRows = await getMoodRows(user.id);
    const insight = await generateInsight(moodRows);

    if (insight) {
      await insertInsight(user.id, insight);
    }
  }
}

export async function scheduleNightlyInsights(): Promise<void> {
  await insightQueue.upsertJobScheduler(
    "nightly-insights-2am",
    {
      pattern: "0 2 * * *"
    },
    {
      name: "nightly-insights",
      data: {},
      opts: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5_000
        }
      }
    }
  );
}

export const insightWorker = new Worker<InsightJobData>(
  queueNames.insight,
  async (job: Job<InsightJobData>) => processInsightJob(job.data ?? {}),
  workerOptions
);
