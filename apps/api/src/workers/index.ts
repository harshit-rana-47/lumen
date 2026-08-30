import { logger } from "../config/logger";
import { embeddingWorker } from "./embedding.worker";
import { insightWorker, scheduleNightlyInsights } from "./insight.worker";
import { memoryWorker } from "./memory.worker";

const workers = [embeddingWorker, memoryWorker, insightWorker];

for (const worker of workers) {
  worker.on("failed", (job, error) => {
    logger.error(
      {
        jobId: job?.id,
        queueName: worker.name,
        err: error
      },
      "Worker job failed"
    );
  });
}

void scheduleNightlyInsights().catch((error: unknown) => {
  logger.error({ err: error }, "Failed to schedule nightly insight job");
  process.exit(1);
});

logger.info(
  {
    queues: workers.map((worker) => worker.name)
  },
  "Lumen workers started"
);
