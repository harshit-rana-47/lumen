import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { setDatabaseUrlLogger } from "./config/databaseUrl";
import { logger } from "./config/logger";
import { waitForAuthDependencies, warmOptionalServices } from "./lib/readiness";
import { bindProcessShutdown } from "./lib/processShutdown";

setDatabaseUrlLogger(logger);

async function startServer(): Promise<void> {
  await waitForAuthDependencies();

  const app = createApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(env.PORT, "0.0.0.0", () => {
      server.off("error", reject);
      logger.info({ port: env.PORT }, "Lumen API listening (auth ready)");
      resolve();
    });
  });

  warmOptionalServices();

  bindProcessShutdown(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  );
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  logger.error({ err: error, message }, "Lumen API failed to start");
  process.exit(1);
});
