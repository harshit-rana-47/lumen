import { Worker, type Job } from "bullmq";
import { embedText } from "../config/embeddings";
import { groqClient, WORKER_MODEL } from "../config/groq";
import { runQuery } from "../config/neo4j";
import { supabaseAdmin } from "../config/supabase";
import { encrypt } from "../lib/encrypt";
import { queueNames } from "../lib/queue";
import { getUserDEK } from "../lib/userDEK";
import {
  getDecryptedJournalBody,
  type JournalJobData,
  stripJsonMarkdownFences,
  workerOptions
} from "./worker.shared";

const MEMORY_CATEGORIES = [
  "identity",
  "relationship",
  "goal",
  "life_event",
  "emotional",
  "preference",
  "habit"
] as const;

type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

type ExtractedFact = {
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number;
};

type MemorySettingsRow = {
  category: string;
  enabled: boolean | null;
};

function isMemoryCategory(value: string): value is MemoryCategory {
  return MEMORY_CATEGORIES.includes(value as MemoryCategory);
}

function parseFacts(raw: string): ExtractedFact[] {
  const parsed = JSON.parse(stripJsonMarkdownFences(raw)) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("Memory extraction response was not an array");
  }

  return parsed.flatMap((item): ExtractedFact[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const candidate = item as Record<string, unknown>;
    const category = typeof candidate.category === "string" ? candidate.category : "";
    const key = typeof candidate.key === "string" ? candidate.key.trim() : "";
    const value = typeof candidate.value === "string" ? candidate.value.trim() : "";
    const confidence =
      typeof candidate.confidence === "number" && Number.isFinite(candidate.confidence)
        ? Math.min(1, Math.max(0, candidate.confidence))
        : 0.8;

    if (!isMemoryCategory(category) || !key || !value) {
      return [];
    }

    return [
      {
        category,
        key,
        value,
        confidence
      }
    ];
  });
}

async function disabledCategories(userId: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("memory_settings")
    .select("category,enabled")
    .eq("user_id", userId)
    .returns<MemorySettingsRow[]>();

  if (error) {
    throw error;
  }

  return new Set((data ?? []).filter((row) => row.enabled === false).map((row) => row.category));
}

async function extractFacts(body: string): Promise<ExtractedFact[]> {
  const completion = await groqClient.chat.completions.create({
    model: WORKER_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Extract facts. Return ONLY a JSON array: [{category, key, value, confidence}]. Categories: identity, relationship, goal, life_event, emotional, preference, habit. No markdown, no explanation."
      },
      {
        role: "user",
        content: body
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;

  if (!raw) {
    return [];
  }

  return parseFacts(raw);
}

async function upsertFact(userId: string, entryId: string, dek: string, fact: ExtractedFact): Promise<void> {
  const encryptedValue = encrypt(fact.value, dek);
  const embedding = await embedText(fact.value);

  const { error } = await supabaseAdmin.from("memory_items").upsert(
    {
      user_id: userId,
      category: fact.category,
      key: fact.key,
      value_encrypted: encryptedValue.ciphertext,
      iv: encryptedValue.iv,
      auth_tag: encryptedValue.authTag,
      confidence: fact.confidence,
      source_entry_id: entryId,
      embedding,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "user_id,category,key"
    }
  );

  if (error) {
    throw error;
  }

  await runQuery(
    `
    MERGE (u:User {id: $userId})
    MERGE (m:Memory {userId: $userId, category: $category, key: $key})
    SET m.valueEncrypted = $valueEncrypted,
        m.iv = $iv,
        m.authTag = $authTag,
        m.confidence = $confidence,
        m.sourceEntryId = $entryId,
        m.updatedAt = datetime()
    MERGE (u)-[:HAS_MEMORY]->(m)
    `,
    {
      userId,
      category: fact.category,
      key: fact.key,
      valueEncrypted: encryptedValue.ciphertext,
      iv: encryptedValue.iv,
      authTag: encryptedValue.authTag,
      confidence: fact.confidence,
      entryId
    }
  );
}

export async function processMemoryJob(data: JournalJobData): Promise<void> {
  const body = await getDecryptedJournalBody(data);
  const [dek, disabled, facts] = await Promise.all([
    getUserDEK(data.userId),
    disabledCategories(data.userId),
    extractFacts(body)
  ]);

  const enabledFacts = facts.filter((fact) => !disabled.has(fact.category));

  for (const fact of enabledFacts) {
    await upsertFact(data.userId, data.entryId, dek, fact);
  }

  const { error } = await supabaseAdmin
    .from("journal_entries")
    .update({
      memory_status: "done",
      updated_at: new Date().toISOString()
    })
    .eq("id", data.entryId)
    .eq("user_id", data.userId)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }
}

export const memoryWorker = new Worker<JournalJobData>(
  queueNames.memory,
  async (job: Job<JournalJobData>) => processMemoryJob(job.data),
  workerOptions
);
