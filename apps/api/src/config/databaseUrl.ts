import dns from "node:dns";
import pg from "pg";

/**
 * Prefer IPv4. Render (and many PaaS hosts) cannot reach Supabase's
 * IPv6-only `db.<ref>.supabase.co` AAAA records (ENETUNREACH).
 */
dns.setDefaultResultOrder("ipv4first");

type DatabaseUrlLogger = {
  info: (obj: Record<string, unknown>, msg: string) => void;
};

let log: DatabaseUrlLogger = {
  info: () => undefined
};

/** Optional late binding so this module does not import the pino logger (env cycle). */
export function setDatabaseUrlLogger(logger: DatabaseUrlLogger): void {
  log = logger;
}

const SUPABASE_DIRECT_HOST = /^db\.([a-z0-9]+)\.supabase\.co$/i;

/** Regions to probe when rewriting a direct Supabase DB URL to the session pooler. */
const POOLER_REGIONS = [
  "ap-southeast-2",
  "ap-southeast-1",
  "ap-south-1",
  "ap-northeast-1",
  "us-east-1",
  "us-west-1",
  "eu-west-1",
  "eu-central-1"
] as const;

let activeDatabaseUrl: string | undefined;

export function getActiveDatabaseUrl(fallback: string): string {
  return activeDatabaseUrl ?? fallback;
}

function postgresSsl(connectionString: string): pg.ClientConfig["ssl"] {
  if (
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  ) {
    return undefined;
  }
  return { rejectUnauthorized: false };
}

function buildPoolerUrl(directUrl: URL, projectRef: string, poolerHost: string): string {
  const user = directUrl.username.includes(".")
    ? directUrl.username
    : `postgres.${projectRef}`;
  const database = directUrl.pathname && directUrl.pathname !== "/" ? directUrl.pathname : "/postgres";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(directUrl.password)}@${poolerHost}:5432${database}`;
}

function poolerCandidates(databaseUrl: string): string[] {
  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return [];
  }

  const match = SUPABASE_DIRECT_HOST.exec(parsed.hostname);
  if (!match?.[1]) {
    return [];
  }

  const projectRef = match[1];
  const hosts: string[] = [];

  const explicitHost = process.env.DATABASE_POOLER_HOST?.trim();
  if (explicitHost) {
    hosts.push(explicitHost);
  }

  const region = process.env.SUPABASE_REGION?.trim();
  const regions = region
    ? [region, ...POOLER_REGIONS.filter((value) => value !== region)]
    : [...POOLER_REGIONS];

  for (const candidateRegion of regions) {
    hosts.push(`aws-1-${candidateRegion}.pooler.supabase.com`);
    hosts.push(`aws-0-${candidateRegion}.pooler.supabase.com`);
  }

  return [...new Set(hosts)].map((host) => buildPoolerUrl(parsed, projectRef, host));
}

async function canConnect(connectionString: string): Promise<boolean> {
  const client = new pg.Client({
    connectionString,
    ssl: postgresSsl(connectionString),
    connectionTimeoutMillis: 5_000
  });

  try {
    await client.connect();
    await client.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

function isIpv6Unreachable(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "ENETUNREACH" || message.includes("ENETUNREACH");
}

/**
 * Returns a Postgres URL that this host can reach.
 * Rewrites Supabase direct (IPv6-only) URLs to the IPv4 session pooler when needed.
 */
export async function resolveReachableDatabaseUrl(databaseUrl: string): Promise<string> {
  if (activeDatabaseUrl) {
    return activeDatabaseUrl;
  }

  let hostname = "";
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    hostname = "";
  }

  const isDirectSupabase = SUPABASE_DIRECT_HOST.test(hostname);
  const candidates = isDirectSupabase ? poolerCandidates(databaseUrl) : [];

  // Supabase free direct hosts are IPv6-only — try the session pooler before IPv6.
  for (const candidate of candidates) {
    if (await canConnect(candidate)) {
      activeDatabaseUrl = candidate;
      log.info(
        { host: new URL(candidate).hostname },
        "Using Supabase session pooler for IPv4 Postgres access"
      );
      return candidate;
    }
  }

  if (await canConnect(databaseUrl)) {
    activeDatabaseUrl = databaseUrl;
    return databaseUrl;
  }

  if (isDirectSupabase) {
    throw new Error(
      "DATABASE_URL points at an IPv6-only Supabase host and no reachable session pooler was found. Set DATABASE_URL to the Session mode pooler URI (port 5432) from Supabase → Project Settings → Database, or set SUPABASE_REGION (e.g. ap-southeast-2)."
    );
  }

  throw new Error(
    "DATABASE_URL is unreachable. Check the connection string, SSL, and network access."
  );
}

export async function withPostgresClient<T>(
  databaseUrl: string,
  run: (client: pg.Client) => Promise<T>
): Promise<T> {
  const connectionString = await resolveReachableDatabaseUrl(databaseUrl);
  const client = new pg.Client({
    connectionString,
    ssl: postgresSsl(connectionString)
  });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export function explainDatabaseConnectivityFailure(error: unknown): Error {
  if (!isIpv6Unreachable(error)) {
    return error instanceof Error ? error : new Error(String(error));
  }

  return new Error(
    "Postgres ENETUNREACH: Supabase direct db.<ref>.supabase.co is IPv6-only and this host cannot reach IPv6. Use the Supabase Session pooler connection string (port 5432) or set SUPABASE_REGION so Lumen can rewrite to aws-*-<region>.pooler.supabase.com."
  );
}

export { postgresSsl };
