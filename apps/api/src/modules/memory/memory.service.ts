import { embedText } from "../../config/embeddings";
import { runQuery } from "../../config/neo4j";
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
  "id,user_id,category,key,value_encrypted,iv,auth_tag,confidence,importance,source_entry_id,user_edited,last_confirmed,created_at,updated_at";

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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function syncMemoryNode(userId: string, memory: MemoryItem, encrypted: { ciphertext: string; iv: string; authTag: string }) {
  await runQuery(
    `
    MERGE (u:User {id: $userId})
    MERGE (m:Memory {id: $id})
    SET m.userId = $userId,
        m.label = $label,
        m.category = $category,
        m.importance = $importance,
        m.valueEncrypted = $valueEncrypted,
        m.iv = $iv,
        m.authTag = $authTag,
        m.updatedAt = datetime()
    MERGE (u)-[:HAS_MEMORY]->(m)
    `,
    {
      userId,
      id: memory.id,
      label: memory.key,
      category: memory.category,
      importance: memory.importance,
      valueEncrypted: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag
    }
  );
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
        last_confirmed: new Date().toISOString()
      })
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    const memory = decryptMemory(data, dek);
    await syncMemoryNode(userId, memory, encrypted);

    return memory;
  }

  async update(userId: string, id: string, input: UpdateMemoryInput): Promise<MemoryItem> {
    const dek = await getUserDEK(userId);
    const updatePayload: Record<string, unknown> = {
      user_edited: true,
      updated_at: new Date().toISOString()
    };
    let encrypted: { ciphertext: string; iv: string; authTag: string } | undefined;

    if (input.value) {
      encrypted = encrypt(input.value, dek);
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
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    const memory = decryptMemory(data, dek);
    await syncMemoryNode(
      userId,
      memory,
      encrypted ?? {
        ciphertext: data.value_encrypted,
        iv: data.iv,
        authTag: data.auth_tag
      }
    );

    return memory;
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

    await runQuery("MATCH (m:Memory {id: $id, userId: $userId}) DETACH DELETE m", { id, userId });

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
      .select(MEMORY_SELECT)
      .single<MemoryRow>();

    if (error) {
      throw error;
    }

    return decryptMemory(data, await getUserDEK(userId));
  }

  async graph(userId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const result = await runQuery(
      `
      MATCH (u:User {id: $userId})-[r:HAS_MEMORY]->(m:Memory)
      RETURN m.id AS id, m.label AS label, m.category AS category, m.importance AS importance, type(r) AS relType
      ORDER BY m.category, m.label
      `,
      { userId }
    );

    const userNode: GraphNode = {
      id: userId,
      label: "You",
      category: "user",
      importance: 10
    };

    const nodes: GraphNode[] = [userNode];
    const edges: GraphEdge[] = [];

    for (const record of result.records) {
      const id = String(record.get("id"));
      nodes.push({
        id,
        label: String(record.get("label") ?? "Memory"),
        category: String(record.get("category") ?? "memory"),
        importance: Number(record.get("importance") ?? 5)
      });
      edges.push({
        source: userId,
        target: id,
        type: String(record.get("relType") ?? "HAS_MEMORY"),
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
