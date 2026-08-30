import { randomUUID } from "node:crypto";
import { embedText } from "../../config/embeddings";
import { encrypt } from "../../lib/encrypt";
import { writeAuditLog } from "../../lib/audit";
import { enqueueEmbedJob } from "../../lib/queue";
import { getUserDEK } from "../../lib/userDEK";
import { supabaseAdmin, type DbClient } from "../../config/supabase";
import {
  decryptOptionalText,
  decryptRequiredText,
  encryptOptionalText,
  encryptRequiredText,
  serializeEncryptedPayload
} from "./journal.encrypt";
import type {
  CalendarJournalQuery,
  CreateJournalInput,
  ListJournalQuery,
  MediaJournalInput,
  SearchJournalQuery,
  UpdateJournalInput
} from "./journal.schema";

type JournalRow = {
  id: string;
  user_id: string;
  journal_type: string;
  title_encrypted: string | null;
  body_encrypted?: string;
  iv?: string | null;
  auth_tag?: string | null;
  mood_score: number | null;
  energy_score: number | null;
  word_count: number | null;
  reading_time_sec: number | null;
  is_pinned: boolean | null;
  is_favorite: boolean | null;
  tags: string[] | null;
  entry_date: string;
  embedding_status: string | null;
  memory_status: string | null;
  created_at: string;
  updated_at: string;
};

type JournalListItem = {
  id: string;
  type: string;
  title: string | null;
  moodScore: number | null;
  energyScore: number | null;
  wordCount: number | null;
  readingTimeSec: number | null;
  isPinned: boolean;
  isFavorite: boolean;
  tags: string[];
  entryDate: string;
  embeddingStatus: string | null;
  memoryStatus: string | null;
  createdAt: string;
  updatedAt: string;
};

type JournalEntry = JournalListItem & {
  body: string;
};

type MatchJournalRow = {
  id: string;
  similarity: number;
};

const JOURNAL_LIST_SELECT =
  "id,user_id,journal_type,title_encrypted,mood_score,energy_score,word_count,reading_time_sec,is_pinned,is_favorite,tags,entry_date,embedding_status,memory_status,created_at,updated_at";

const JOURNAL_FULL_SELECT = `${JOURNAL_LIST_SELECT},body_encrypted,iv,auth_tag`;
const MEDIA_BUCKET = "journal-media";

function wordCount(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

function readingTimeSec(words: number): number {
  return Math.max(1, Math.ceil((words / 200) * 60));
}

function toListItem(row: JournalRow, dek: string): JournalListItem {
  return {
    id: row.id,
    type: row.journal_type,
    title: decryptOptionalText(row.title_encrypted, dek),
    moodScore: row.mood_score,
    energyScore: row.energy_score,
    wordCount: row.word_count,
    readingTimeSec: row.reading_time_sec,
    isPinned: row.is_pinned ?? false,
    isFavorite: row.is_favorite ?? false,
    tags: row.tags ?? [],
    entryDate: row.entry_date,
    embeddingStatus: row.embedding_status,
    memoryStatus: row.memory_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toEntry(row: JournalRow, dek: string): JournalEntry {
  if (!row.body_encrypted) {
    throw new Error("Journal body is missing");
  }

  return {
    ...toListItem(row, dek),
    body: decryptRequiredText(
      row.body_encrypted,
      dek,
      row.iv && row.auth_tag
        ? {
            ciphertext: row.body_encrypted,
            iv: row.iv,
            authTag: row.auth_tag
          }
        : undefined
    )
  };
}

function storageObjectName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Queue only the embedding job on create/update.
 * Root cause of double memory extraction: create() previously also enqueued
 * memory-queue, while embedding.worker already chains memory-queue on success.
 */
async function enqueueJournalPipeline(userId: string, entryId: string, _reason: string): Promise<void> {
  await enqueueEmbedJob({ userId, entryId });
}

export class JournalService {
  /**
   * @param db Prefer RLS-scoped user client from auth middleware when available.
   * Falls back to service-role admin (still filters by userId).
   */
  async list(userId: string, query: ListJournalQuery, db: DbClient = supabaseAdmin) {
    const dek = await getUserDEK(userId);
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let request = db
      .from("journal_entries")
      .select(JOURNAL_LIST_SELECT, { count: "exact" })
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (query.type) {
      request = request.eq("journal_type", query.type);
    }

    if (query.startDate) {
      request = request.gte("entry_date", query.startDate);
    }

    if (query.endDate) {
      request = request.lte("entry_date", query.endDate);
    }

    if (query.tags && query.tags.length > 0) {
      request = request.contains("tags", query.tags);
    }

    const { data, error, count } = await request.returns<JournalRow[]>();

    if (error) {
      throw error;
    }

    return {
      entries: (data ?? []).map((row) => toListItem(row, dek)),
      page: query.page,
      limit: query.limit,
      total: count ?? 0
    };
  }

  async create(userId: string, input: CreateJournalInput): Promise<JournalEntry> {
    const dek = await getUserDEK(userId);
    const encryptedBody = encryptRequiredText(input.body, dek);
    const bodyPayload = JSON.parse(encryptedBody) as { iv: string; authTag: string };
    const words = wordCount(input.body);

    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .insert({
        user_id: userId,
        journal_type: input.type,
        title_encrypted: encryptOptionalText(input.title, dek),
        body_encrypted: encryptedBody,
        iv: bodyPayload.iv,
        auth_tag: bodyPayload.authTag,
        mood_score: input.moodScore ?? null,
        energy_score: input.energyScore ?? null,
        tags: input.tags,
        entry_date: input.entryDate ?? new Date().toISOString().slice(0, 10),
        word_count: words,
        reading_time_sec: readingTimeSec(words),
        embedding_status: "pending",
        memory_status: "pending"
      })
      .select(JOURNAL_FULL_SELECT)
      .single<JournalRow>();

    if (error) {
      throw error;
    }

    await Promise.all([
      enqueueJournalPipeline(userId, data.id, "journal.created"),
      writeAuditLog({ actorId: userId, action: "journal.create", resource: data.id })
    ]);

    return toEntry(data, dek);
  }

  async get(userId: string, id: string, db: DbClient = supabaseAdmin): Promise<JournalEntry> {
    const dek = await getUserDEK(userId);
    const { data, error } = await db
      .from("journal_entries")
      .select(JOURNAL_FULL_SELECT)
      .eq("user_id", userId)
      .eq("id", id)
      .is("deleted_at", null)
      .single<JournalRow>();

    if (error) {
      throw error;
    }

    await writeAuditLog({ actorId: userId, action: "journal.read", resource: id });

    return toEntry(data, dek);
  }

  async update(userId: string, id: string, input: UpdateJournalInput): Promise<JournalEntry> {
    const dek = await getUserDEK(userId);
    const existing = await this.get(userId, id);
    const nextTitle = input.title === undefined ? existing.title : input.title;
    const nextBody = input.body ?? existing.body;
    const encryptedBody = encryptRequiredText(nextBody, dek);
    const bodyPayload = JSON.parse(encryptedBody) as { iv: string; authTag: string };
    const words = wordCount(nextBody);

    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .update({
        journal_type: input.type ?? existing.type,
        title_encrypted: encryptOptionalText(nextTitle, dek),
        body_encrypted: encryptedBody,
        iv: bodyPayload.iv,
        auth_tag: bodyPayload.authTag,
        mood_score: input.moodScore === undefined ? existing.moodScore : input.moodScore,
        energy_score: input.energyScore === undefined ? existing.energyScore : input.energyScore,
        tags: input.tags ?? existing.tags,
        entry_date: input.entryDate ?? existing.entryDate,
        is_pinned: input.isPinned ?? existing.isPinned,
        is_favorite: input.isFavorite ?? existing.isFavorite,
        word_count: words,
        reading_time_sec: readingTimeSec(words),
        embedding_status: input.body ? "pending" : existing.embeddingStatus,
        memory_status: input.body ? "pending" : existing.memoryStatus,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("id", id)
      .is("deleted_at", null)
      .select(JOURNAL_FULL_SELECT)
      .single<JournalRow>();

    if (error) {
      throw error;
    }

    if (input.body) {
      await enqueueJournalPipeline(userId, id, "journal.updated");
    }

    return toEntry(data, dek);
  }

  async delete(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const { error } = await supabaseAdmin
      .from("journal_entries")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      throw error;
    }

    await writeAuditLog({ actorId: userId, action: "journal.delete", resource: id });

    return {
      id,
      deleted: true
    };
  }

  async search(userId: string, query: SearchJournalQuery) {
    if (!query.semantic) {
      return {
        entries: [],
        notice: "Plaintext search is unavailable for encrypted journal content. Use semantic=true."
      };
    }

    const dek = await getUserDEK(userId);
    const queryEmbedding = await embedText(query.q);
    const { data: matches, error } = await supabaseAdmin
      .rpc("match_journals", {
        query_embedding: queryEmbedding,
        user_uuid: userId,
        match_count: query.limit
      })
      .returns<MatchJournalRow[]>();

    if (error) {
      throw error;
    }

    const semanticMatches = (matches ?? []) as MatchJournalRow[];
    const ids = semanticMatches.map((match) => match.id);

    if (ids.length === 0) {
      return { entries: [] };
    }

    const { data: rows, error: rowsError } = await supabaseAdmin
      .from("journal_entries")
      .select(JOURNAL_LIST_SELECT)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .in("id", ids)
      .returns<JournalRow[]>();

    if (rowsError) {
      throw rowsError;
    }

    const rowsById = new Map((rows ?? []).map((row) => [row.id, row]));

    return {
      entries: semanticMatches
        .map((match): (JournalListItem & { similarity: number }) | undefined => {
          const row = rowsById.get(match.id);

          if (!row) {
            return undefined;
          }

          return {
            ...toListItem(row, dek),
            similarity: match.similarity
          };
        })
        .filter((entry): entry is JournalListItem & { similarity: number } => entry !== undefined)
    };
  }

  async calendar(userId: string, query: CalendarJournalQuery) {
    const monthStart = `${query.year}-${String(query.month).padStart(2, "0")}-01`;
    const nextMonth = new Date(Date.UTC(query.year, query.month, 1)).toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .select("entry_date,mood_score")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .gte("entry_date", monthStart)
      .lt("entry_date", nextMonth)
      .returns<Array<{ entry_date: string; mood_score: number | null }>>();

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      date: row.entry_date,
      hasEntry: true,
      moodScore: row.mood_score
    }));
  }

  async createMediaUpload(userId: string, entryId: string, input: MediaJournalInput) {
    await this.get(userId, entryId);

    const dek = await getUserDEK(userId);
    const storagePath = `${userId}/${entryId}/${randomUUID()}-${storageObjectName(input.fileName)}`;
    const { data: signedUpload, error: signedUploadError } = await supabaseAdmin.storage
      .from(MEDIA_BUCKET)
      .createSignedUploadUrl(storagePath);

    if (signedUploadError) {
      throw signedUploadError;
    }

    const encryptedStoragePath = serializeEncryptedPayload(encrypt(storagePath, dek));
    const { data: media, error: mediaError } = await supabaseAdmin
      .from("media_attachments")
      .insert({
        user_id: userId,
        entry_id: entryId,
        s3_key: encryptedStoragePath,
        media_type: input.mediaType,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes
      })
      .select("id")
      .single<{ id: string }>();

    if (mediaError) {
      throw mediaError;
    }

    return {
      mediaId: media.id,
      signedUrl: signedUpload.signedUrl
    };
  }
}

export const journalService = new JournalService();
