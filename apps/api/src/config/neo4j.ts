import neo4j, { type QueryResult, type RecordShape } from "neo4j-driver";
import { env } from "./env";

type QueryParams = Record<string, unknown>;

export const neo4jDriver = neo4j.driver(
  env.NEO4J_URI,
  neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD)
);

export async function runQuery<T extends RecordShape = RecordShape>(
  cypher: string,
  params: QueryParams = {}
): Promise<QueryResult<T>> {
  const session = neo4jDriver.session();

  try {
    return await session.run<T>(cypher, params);
  } finally {
    await session.close();
  }
}

export async function closeNeo4jDriver(): Promise<void> {
  await neo4jDriver.close();
}
