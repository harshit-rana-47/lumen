import express, { type Express, type Request } from "express";
import type { User } from "@supabase/supabase-js";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { EXPORT_LIMIT, exportLimiter } from "./rateLimit";

function asUser(id: string): User {
  return { id } as User;
}

function assignUser(request: Request, userId: string): void {
  request.user = asUser(userId);
}

async function withServer(setup: (app: Express) => void, run: (baseUrl: string) => Promise<void>) {
  const app = express();
  setup(app);
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

function withUser(userId: string): express.RequestHandler {
  return (request, _response, next) => {
    assignUser(request, userId);
    next();
  };
}

async function postExport(baseUrl: string): Promise<number> {
  const response = await fetch(`${baseUrl}/export`, { method: "POST" });
  return response.status;
}

describe("exportLimiter", () => {
  it("allows a user to take more than one copy in the same window", async () => {
    const userId = `export-retry-${Date.now()}`;
    await withServer(
      (app) => {
        app.post("/export", withUser(userId), exportLimiter, (_request, response) => {
          response.json({ success: true });
        });
      },
      async (baseUrl) => {
        expect(await postExport(baseUrl)).toBe(200);
        expect(await postExport(baseUrl)).toBe(200);
        expect(await postExport(baseUrl)).toBe(200);
      }
    );
  });

  it("does not let one user's exports starve another user", async () => {
    const userA = `export-a-${Date.now()}`;
    const userB = `export-b-${Date.now()}`;
    await withServer(
      (app) => {
        app.post("/export", (request, response, next) => {
          const header = request.headers["x-user-id"];
          assignUser(request, String(header));
          next();
        }, exportLimiter, (_request, response) => {
          response.json({ success: true });
        });
      },
      async (baseUrl) => {
        for (let index = 0; index < EXPORT_LIMIT; index += 1) {
          const response = await fetch(`${baseUrl}/export`, {
            method: "POST",
            headers: { "x-user-id": userA }
          });
          expect(response.status).toBe(200);
        }

        const blocked = await fetch(`${baseUrl}/export`, {
          method: "POST",
          headers: { "x-user-id": userA }
        });
        expect(blocked.status).toBe(429);

        const otherUser = await fetch(`${baseUrl}/export`, {
          method: "POST",
          headers: { "x-user-id": userB }
        });
        expect(otherUser.status).toBe(200);
      }
    );
  });
});
