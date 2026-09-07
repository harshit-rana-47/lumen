import { randomUUID } from "node:crypto";
import { embedText } from "../../config/embeddings";
import { decrypt, encrypt } from "../../lib/encrypt";
import { journalPlainText } from "../../lib/journalDocument";
import { writeAuditLog } from "../../lib/audit";
import { enqueueEmbedJob } from "../../lib/queue";
import { getUserDEK } from "../../lib/userDEK";
import { supabaseAdmin, type DbClient } from "../../config/supabase";
import { windowStartDateKey } from "../../lib/dateKey";
import { foldActivityCounts, type ActivityCountRow } from "../../lib/journalActivity";
import { httpError } from "../../lib/httpError";
import { reflectSessionTitle } from "../../lib/reflectSession";
import { logger } from "../../config/logger";
import {
  decryptOptionalText,
  decryptRequiredText,
  encryptOptionalText,
  encryptRequiredText,
  parseEncryptedPayload,
  serializeEncryptedPayload
} from "./journal.encrypt";
import type {
  ActivityJournalQuery,
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
  /** First plaintext excerpt when `title` is empty. Display-only; not a stored title. */
  plainPreview: string | null;
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
const ACTIVITY_PAGE_SIZE = 1000;
const ACTIVITY_MAX_ROWS = 10_000;

function wordCount(body: string): number {
  return journalPlainText(body).trim().split(/\s+/).filter(Boolean).length;
}

function readingTimeSec(words: number): number {
  return Math.max(1, Math.ceil((words / 200) * 60));
}

function toListItem(row: JournalRow, dek: string): JournalListItem {
  return {
    id: row.id,
    type: row.journal_type,
    title: decryptOptionalText(row.title_encrypted, dek),
    plainPreview: null,
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

async function withPlainPreviews(
  userId: string,
  items: JournalListItem[],
  dek: string,
  db: DbClient
): Promise<JournalListItem[]> {
  const untitledIds = items.filter((item) => !item.title).map((item) => item.id);
  if (untitledIds.length === 0) {
    return items;
  }

  const { data, error } = await db
    .from("journal_entries")
    .select(JOURNAL_FULL_SELECT)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("id", untitledIds)
    .returns<JournalRow[]>();

  if (error) {
    throw error;
  }

  const previewById = new Map<string, string>();
  for (const row of data ?? []) {
    if (!row.body_encrypted) {
      continue;
    }
    try {
      const body = decryptRequiredText(
        row.body_encrypted,
        dek,
        row.iv && row.auth_tag
          ? {
              ciphertext: row.body_encrypted,
              iv: row.iv,
              authTag: row.auth_tag
            }
          : undefined
      );
      const plain = journalPlainText(body).trim();
      if (plain) {
        previewById.set(row.id, plain.slice(0, 400));
      }
    } catch {
      // Display falls back to the entry date.
    }
  }

  return items.map((item) =>
    item.title ? item : { ...item, plainPreview: previewById.get(item.id) ?? null }
  );
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
    const dekStartedAt = Date.now();
    const dek = await getUserDEK(userId);
    const dekCached = Date.now() - dekStartedAt < 5;
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
      entries: await withPlainPreviews(userId, (data ?? []).map((row) => toListItem(row, dek)), dek, db),
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
        entry_date: input.entryDate,
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

    void writeAuditLog({ actorId: userId, action: "journal.read", resource: id });
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
    const { data, error } = await supabaseAdmin
      .from("journal_entries")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId)
      .eq("id", id)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle<{ id: string }>();

    if (error) {
      throw error;
    }

    if (!data) {
      throw httpError(404, "Journal entry not found");
    }

    await Promise.all([
      this.purgeMedia(userId, id),
      this.archiveDerivedFromEntry(userId, id),
      writeAuditLog({ actorId: userId, action: "journal.delete", resource: id })
    ]);

    return {
      id,
      deleted: true
    };
  }

  /**
   * Soft-delete must not leave readable media, active memories, or Reflect
   * sessions pointing at the page. Chat used as *context* is not a FK — we
   * only archive sessions titled `reflect:<entryId>`. General Chat is untouched.
   *
   * `memory_items.status` exists in later migrations; older databases only have
   * `source_entry_id`. Always detach the source. Set `superseded` when present.
   */
  private async archiveDerivedFromEntry(userId: string, entryId: string): Promise<void> {
    const now = new Date().toISOString();
    const autoMemories = await supabaseAdmin
      .from("memory_items")
      .update({
        status: "superseded",
        source_entry_id: null,
        updated_at: now
      })
      .eq("user_id", userId)
      .eq("source_entry_id", entryId)
      .or("user_edited.is.null,user_edited.eq.false");

    if (autoMemories.error?.message?.includes("status")) {
      const fallback = await supabaseAdmin
        .from("memory_items")
        .update({
          source_entry_id: null,
          updated_at: now
        })
        .eq("user_id", userId)
        .eq("source_entry_id", entryId)
        .or("user_edited.is.null,user_edited.eq.false");
      if (fallback.error) {
        throw fallback.error;
      }
    } else if (autoMemories.error) {
      throw autoMemories.error;
    }

    const editedMemories = await supabaseAdmin
      .from("memory_items")
      .update({ source_entry_id: null, updated_at: now })
      .eq("user_id", userId)
      .eq("source_entry_id", entryId)
      .eq("user_edited", true);
    if (editedMemories.error) {
      throw editedMemories.error;
    }

    const reflect = await supabaseAdmin
      .from("chat_sessions")
      .update({ is_archived: true, updated_at: now })
      .eq("user_id", userId)
      .eq("mode", "reflection")
      .eq("title", reflectSessionTitle(entryId));
    if (reflect.error) {
      throw reflect.error;
    }
  }

  private async purgeMedia(userId: string, entryId: string): Promise<void> {
    const dek = await getUserDEK(userId);
    const { data, error } = await supabaseAdmin
      .from("media_attachments")
      .select("id,s3_key")
      .eq("user_id", userId)
      .eq("entry_id", entryId)
      .returns<Array<{ id: string; s3_key: string }>>();

    if (error) {
      throw error;
    }

    const paths: string[] = [];
    for (const row of data ?? []) {
      try {
        paths.push(decrypt(parseEncryptedPayload(row.s3_key), dek));
      } catch {
        // Skip undecryptable keys; still drop the row below.
      }
    }

    if (paths.length > 0) {
      const { error: removeError } = await supabaseAdmin.storage.from(MEDIA_BUCKET).remove(paths);
      if (removeError) {
        throw removeError;
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("media_attachments")
      .delete()
      .eq("user_id", userId)
      .eq("entry_id", entryId);

    if (deleteError) {
      throw deleteError;
    }
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

    const listed = await withPlainPreviews(
      userId,
      semanticMatches.flatMap((match) => {
        const row = rowsById.get(match.id);
        return row ? [toListItem(row, dek)] : [];
      }),
      dek,
      supabaseAdmin
    );
    const listedById = new Map(listed.map((entry) => [entry.id, entry]));

    return {
      entries: semanticMatches.flatMap((match) => {
        const entry = listedById.get(match.id);
        return entry ? [{ ...entry, similarity: match.similarity }] : [];
      })
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

  /**
   * Per-day entry counts for the activity calendar.
   *
   * Reads only the plaintext `entry_date`, so this never touches the user DEK or
   * decrypts a title/body. Served by journal_entries_user_entry_date_idx.
   * Only active days are returned; the client fills the empty grid cells.
   */
  async activity(userId: string, query: ActivityJournalQuery) {
    const to = query.end;
    const from = windowStartDateKey(to, query.days);

    const { data, error } = await supabaseAdmin.rpc("journal_activity_counts", {
      p_user_id: userId,
      p_from: from,
      p_to: to
    });

    if (!error) {
      return foldActivityCounts(from, to, (data ?? []) as ActivityCountRow[]);
    }

    logger.warn({ err: error, userId }, "journal_activity_counts RPC unavailable; paging rows");
    return this.activityByPaging(userId, from, to);
  }

  private async activityByPaging(userId: string, from: string, to: string) {
    const counts = new Map<string, number>();
    let totalEntries = 0;
    let offset = 0;

    for (;;) {
      const { data, error } = await supabaseAdmin
        .from("journal_entries")
        .select("entry_date")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: true })
        .range(offset, offset + ACTIVITY_PAGE_SIZE - 1)
        .returns<Array<{ entry_date: string }>>();

      if (error) {
        throw error;
      }

      const rows = data ?? [];

      for (const row of rows) {
        counts.set(row.entry_date, (counts.get(row.entry_date) ?? 0) + 1);
      }

      totalEntries += rows.length;
      offset += rows.length;

      if (rows.length < ACTIVITY_PAGE_SIZE || offset >= ACTIVITY_MAX_ROWS) {
        break;
      }
    }

    return {
      from,
      to,
      totalEntries,
      days: Array.from(counts, ([date, count]) => ({ date, count })).sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    };
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

  async listMedia(userId: string, entryId: string) {
    await this.get(userId, entryId);
    const dek = await getUserDEK(userId);
    const { data, error } = await supabaseAdmin
      .from("media_attachments")
      .select("id,media_type,mime_type,size_bytes,s3_key,created_at")
      .eq("user_id", userId)
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          media_type: string;
          mime_type: string | null;
          size_bytes: number | null;
          s3_key: string;
          created_at: string;
        }>
      >();

    if (error) {
      throw error;
    }

    const items = (
      await Promise.all(
        (data ?? []).map(async (row) => {
          try {
            const storagePath = decrypt(parseEncryptedPayload(row.s3_key), dek);
            const { data: signed, error: signedError } = await supabaseAdmin.storage
              .from(MEDIA_BUCKET)
              .createSignedUrl(storagePath, 60 * 60);

            if (signedError || !signed?.signedUrl) {
              return null;
            }

            return {
              id: row.id,
              mediaType: row.media_type,
              mimeType: row.mime_type,
              sizeBytes: row.size_bytes,
              createdAt: row.created_at,
              url: signed.signedUrl
            };
          } catch {
            return null;
          }
        })
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    return { items };
  }

  async deleteMedia(userId: string, entryId: string, mediaId: string): Promise<{ id: string; deleted: true }> {
    await this.get(userId, entryId);
    const dek = await getUserDEK(userId);
    const { data, error } = await supabaseAdmin
      .from("media_attachments")
      .select("id,s3_key")
      .eq("user_id", userId)
      .eq("entry_id", entryId)
      .eq("id", mediaId)
      .maybeSingle<{ id: string; s3_key: string }>();

    if (error) {
      throw error;
    }

    if (!data) {
      throw Object.assign(new Error("Media not found"), { status: 404 });
    }

    try {
      const storagePath = decrypt(parseEncryptedPayload(data.s3_key), dek);
      await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([storagePath]);
    } catch {
      // Drop the row even if the object is already gone.
    }

    const { error: deleteError } = await supabaseAdmin
      .from("media_attachments")
      .delete()
      .eq("user_id", userId)
      .eq("entry_id", entryId)
      .eq("id", mediaId);

    if (deleteError) {
      throw deleteError;
    }

    return { id: mediaId, deleted: true };
  }
}

export const journalService = new JournalService();
