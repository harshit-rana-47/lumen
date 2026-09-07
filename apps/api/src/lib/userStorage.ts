import { supabaseAdmin } from "../config/supabase";
import { logger } from "../config/logger";

export const USER_STORAGE_BUCKETS = ["journal-media", "user-exports"] as const;

const PAGE_SIZE = 100;
const REMOVE_BATCH = 100;

type ListedObject = {
  id: string | null;
  name: string;
};

function isMissingBucket(message: string): boolean {
  return /not found|does not exist/i.test(message);
}

async function listLevel(bucket: string, prefix: string): Promise<ListedObject[]> {
  const items: ListedObject[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabaseAdmin.storage.from(bucket).list(prefix, {
      limit: PAGE_SIZE,
      offset
    });

    if (error) {
      if (isMissingBucket(error.message)) {
        return [];
      }
      throw error;
    }

    const page = (data ?? []) as ListedObject[];
    items.push(...page);

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += page.length;
  }

  return items;
}

async function collectObjectPaths(bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  const items = await listLevel(bucket, prefix);

  for (const item of items) {
    if (!item.name) {
      continue;
    }

    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id == null) {
      paths.push(...(await collectObjectPaths(bucket, path)));
    } else {
      paths.push(path);
    }
  }

  return paths;
}

async function removePaths(bucket: string, paths: string[]): Promise<void> {
  for (let index = 0; index < paths.length; index += REMOVE_BATCH) {
    const batch = paths.slice(index, index + REMOVE_BATCH);
    const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
    if (error) {
      throw error;
    }
  }
}

/** Deletes every Storage object under `{userId}/` in the known user buckets. */
export async function purgeUserStorage(userId: string): Promise<void> {
  for (const bucket of USER_STORAGE_BUCKETS) {
    const paths = await collectObjectPaths(bucket, userId);
    if (paths.length === 0) {
      continue;
    }

    await removePaths(bucket, paths);
    logger.info({ userId, bucket, count: paths.length }, "purged user storage objects");
  }
}
