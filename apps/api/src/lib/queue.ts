import { Queue, type ConnectionOptions } from "bullmq";
import { env } from "../config/env";

function createBullMQConnection(): ConnectionOptions {
  const url = new URL(env.REDIS_URL);
  const connection: ConnectionOptions = {
    host: url.hostname,
    port: Number(url.port || 6379),
    maxRetriesPerRequest: null
  };

  if (url.username) {
    connection.username = decodeURIComponent(url.username);
  }

  if (url.password) {
    connection.password = decodeURIComponent(url.password);
  }

  if (url.protocol === "rediss:") {
    connection.tls = {};
  }

  return connection;
}

export const bullMQConnection = createBullMQConnection();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5_000
  },
  removeOnComplete: 100,
  removeOnFail: 1_000
} as const;

export const queueNames = {
  embedding: "embedding-queue",
  memory: "memory-queue",
  insight: "insight-queue"
} as const;

export const embeddingQueue = new Queue(queueNames.embedding, {
  connection: bullMQConnection,
  defaultJobOptions
});

export const memoryQueue = new Queue(queueNames.memory, {
  connection: bullMQConnection,
  defaultJobOptions
});

export const insightQueue = new Queue(queueNames.insight, {
  connection: bullMQConnection,
  defaultJobOptions
});
