import { embedText } from "../../config/embeddings";
import { supabaseAdmin } from "../../config/supabase";
import { decrypt, encrypt } from "../../lib/encrypt";
import { getUserDEK } from "../../lib/userDEK";
import type {
  CreateMemoryInput,
  ListMemoryQuery,
  MemoryCategory,
  MemorySettingsInput,
  UpdateMemoryInput
} from "./memory.schema";

type MemoryRow = {
  id: string;
  user_id: string;
  category: MemoryCategory;
  key: string;
  value_encrypted: string;
  iv: string;
  auth_tag: string;
  confidence: number | null;
  importance: number | null;
  source_entry_id: string | null;
  user_edited: boolean | null;
  last_confirmed: string | null;
  version: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

type MemoryItem = {
  id: string;
  category: MemoryCategory;
  key: string;
  value: string;
  confidence: number | null;
  importance: number;
  sourceEntryId: string | null;
  userEdited: boolean;
  lastConfirmed: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
};

type GraphNode = {
  id: string;
  label: string;
  category: string;
  importance: number;
};

type GraphEdge = {
  source: string;
  target: string;
  type: string;
  weight: number;
};

const MEMORY_SELECT =
  "id,user_id,category,key,value_encrypted,iv,auth_tag,confidence,importance,source_entry_id,user_edited,last_confirmed,version,status,created_at,updated_at";

const MEMORY_CATEGORIES: MemoryCategory[] = [
  "identity",
  "relationship",
  "goal",
  "life_event",
  "emotional",
  "preference",
  "habit"
];

function decryptMemory(row: MemoryRow, dek: string): MemoryItem {
  return {
    id: row.id,
    category: row.category,
    key: row.key,
    value: decrypt(
      {
        ciphertext: row.value_encrypted,
        iv: row.iv,
        authTag: row.auth_tag
      },
      dek
    ),
    confidence: row.confidence,
    importance: row.importance ?? 5,
    sourceEntryId: row.source_entry_id,
    userEdited: row.user_edited ?? false,
    lastConfirmed: row.last_confirmed,
    version: row.version ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class MemoryService {
  async list(userId: string, query: ListMemoryQuery) {
    const dek = await getUserDEK(userId);
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let request = supabaseAdmin
      .from("memory_items")
      .select(MEMORY_SELECT, { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (query.category) {
      request = request.eq("category", query.category);
    }

    const { data, error, count } = await request.returns<MemoryRow[]>();

    if (error) {
      throw error;
    }

    return {
      memories: (data ?? []).map((row) => decryptMemory(row, dek)),
      page: query.page,
      limit: query.limit,
      total: count ?? 0
    };
  }

  async create(userId: string, input: CreateMemoryInput): Promise<MemoryItem> {
    const dek = await getUserDEK(userId);
    const encrypted = encrypt(input.value, dek);
    const embedding = await embedText(input.value);

    const { data, error } = await supabaseAdmin
      .from("memory_items")
      .insert({
        user_id: userId,
        category: input.category,
        key: input.key,
        value_encrypted: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        confidence: input.confidence ?? 1,
        importance: input.importance ?? 5,
        embedding,
        user_edited: true,
        status: "active",
        version: 1,
        last_confirmed: new Date().toISOString()
      })
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    return decryptMemory(data, dek);
  }

  async update(userId: string, id: string, input: UpdateMemoryInput): Promise<MemoryItem> {
    const dek = await getUserDEK(userId);
    const updatePayload: Record<string, unknown> = {
      user_edited: true,
      updated_at: new Date().toISOString()
    };

    if (input.value) {
      const encrypted = encrypt(input.value, dek);
      updatePayload.value_encrypted = encrypted.ciphertext;
      updatePayload.iv = encrypted.iv;
      updatePayload.auth_tag = encrypted.authTag;
      updatePayload.embedding = await embedText(input.value);
    }

    if (input.importance !== undefined) {
      updatePayload.importance = input.importance;
    }

    if (input.confidence !== undefined) {
      updatePayload.confidence = input.confidence;
    }

    const { data, error } = await supabaseAdmin
      .from("memory_items")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .eq("status", "active")
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    return decryptMemory(data, dek);
  }

  async delete(userId: string, id: string): Promise<{ id: string; deleted: true }> {
    const { error } = await supabaseAdmin
      .from("memory_items")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return { id, deleted: true };
  }

  async confirm(userId: string, id: string): Promise<MemoryItem> {
    const { data, error } = await supabaseAdmin
      .from("memory_items")
      .update({
        last_confirmed: new Date().toISOString(),
        user_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("user_id", userId)
      .eq("status", "active")
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    return decryptMemory(data, await getUserDEK(userId));
  }

  /**
   * Lightweight relationship view derived from Postgres memory_items.
   * Replaces Neo4j graph sync (removed in Phase 1.5).
   */
  async graph(userId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const { data, error } = await supabaseAdmin
      .from("memory_items")
      .select("id,category,key,importance")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("category", { ascending: true })
      .returns<Array<{ id: string; category: string; key: string; importance: number | null }>>();

    if (error) {
      throw error;
    }

    const userNode: GraphNode = {
      id: userId,
      label: "You",
      category: "user",
      importance: 10
    };

    const nodes: GraphNode[] = [userNode];
    const edges: GraphEdge[] = [];

    for (const row of data ?? []) {
      nodes.push({
        id: row.id,
        label: row.key,
        category: row.category,
        importance: row.importance ?? 5
      });
      edges.push({
        source: userId,
        target: row.id,
        type: "HAS_MEMORY",
        weight: 1
      });
    }

    return { nodes, edges };
  }

  async settings(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("memory_settings")
      .select("category,enabled,updated_at")
      .eq("user_id", userId)
      .returns<Array<{ category: MemoryCategory; enabled: boolean | null; updated_at: string | null }>>();

    if (error) {
      throw error;
    }

    const existing = new Map((data ?? []).map((row) => [row.category, row]));

    return MEMORY_CATEGORIES.map((category) => {
      const row = existing.get(category);
      return {
        category,
        enabled: row?.enabled ?? true,
        updatedAt: row?.updated_at ?? null
      };
    });
  }

  async updateSettings(userId: string, input: MemorySettingsInput) {
    const { data, error } = await supabaseAdmin
      .from("memory_settings")
      .upsert(
        {
          user_id: userId,
          category: input.category,
          enabled: input.enabled,
          updated_at: new Date().toISOString()
        },
        { onConflict: "user_id,category" }
      )
      .select("category,enabled,updated_at")
      .single<{ category: MemoryCategory; enabled: boolean; updated_at: string }>();

    if (error) {
      throw error;
    }

    return {
      category: data.category,
      enabled: data.enabled,
      updatedAt: data.updated_at
    };
  }
}

export const memoryService = new MemoryService();
