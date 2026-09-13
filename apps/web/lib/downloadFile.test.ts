import {
  USER_EXPORT_BUSY_TIMEOUT_MS,
  USER_EXPORT_DOWNLOAD_PATH,
  USER_EXPORT_DOWNLOAD_TYPE,
  beginSameOriginExportDownload,
  downloadBlobAsFile,
  parseExportRouteError,
  safeExportFileName,
  userExportBlob,
  userExportDownloadUrl
} from "./downloadFile";
import { serializeUserExport } from "./youView";

describe("user export download", () => {
  it("keeps the hosted filename when it is a dated lumen export", () => {
    expect(safeExportFileName("lumen-export-2026-09-13.json")).toBe("lumen-export-2026-09-13.json");
  });

  it("rejects unsafe names so the browser is not given a path", () => {
    expect(safeExportFileName("../secret.json", new Date("2026-09-13T00:00:00.000Z"))).toBe(
      "lumen-export-2026-09-13.json"
    );
  });

  it("uses octet-stream so Chrome saves instead of previewing JSON", () => {
    const blob = userExportBlob({ journals: [] });
    expect(blob.type).toBe(USER_EXPORT_DOWNLOAD_TYPE);
    expect(blob.size).toBe(serializeUserExport({ journals: [] }).length);
  });

  it("builds a cache-busted same-origin export URL", () => {
    expect(userExportDownloadUrl(1_700_000_000_000)).toBe(`${USER_EXPORT_DOWNLOAD_PATH}?ts=1700000000000`);
  });

  it("reads JSON errors from the export route and ignores attachments", () => {
    expect(parseExportRouteError('{"success":false,"error":"You are not signed in."}')).toBe(
      "You are not signed in."
    );
    expect(parseExportRouteError('{"exportedAt":"2026-09-13T00:00:00.000Z"}')).toBeNull();
    expect(parseExportRouteError("not json")).toBeNull();
  });

  it("ends the export busy state on a short timer so the button cannot stay stuck", () => {
    expect(USER_EXPORT_BUSY_TIMEOUT_MS).toBeLessThanOrEqual(4_000);
  });

  it("clicks a download link in the current window instead of a hidden iframe", () => {
    const clicks: string[] = [];
    const fakeLink = {
      href: "",
      download: "",
      target: "",
      rel: "",
      type: "",
      style: { display: "" },
      click() {
        clicks.push("click");
      }
    };
    const appended: unknown[] = [];
    const fakeDocument = {
      createElement(tag: string) {
        expect(tag).toBe("a");
        return fakeLink;
      },
      body: {
        appendChild(node: unknown) {
          appended.push(node);
          return node;
        }
      }
    };

    const result = beginSameOriginExportDownload(fakeDocument as unknown as Document);

    expect(result).toBe(fakeLink);
    expect(fakeLink.href).toContain(USER_EXPORT_DOWNLOAD_PATH);
    expect(fakeLink.download).toMatch(/^lumen-export-\d{4}-\d{2}-\d{2}\.json$/);
    expect(fakeLink.target).toBe("");
    expect(fakeLink.type).toBe(USER_EXPORT_DOWNLOAD_TYPE);
    expect(appended).toEqual([fakeLink]);
    expect(clicks).toEqual(["click"]);
  });

  it("clicks a hidden attachment link and does not remove it immediately", () => {
    const clicks: string[] = [];
    const removed: string[] = [];
    const timeouts: number[] = [];

    const fakeLink = {
      href: "",
      download: "",
      rel: "",
      type: "",
      style: { display: "" },
      click() {
        clicks.push("click");
      },
      remove() {
        removed.push("removed");
      }
    };

    const fakeDocument = {
      createElement(tag: string) {
        expect(tag).toBe("a");
        return fakeLink;
      },
      body: {
        appendChild(node: unknown) {
          expect(node).toBe(fakeLink);
          return node;
        }
      }
    };

    const previous = {
      window: globalThis.window,
      document: globalThis.document,
      navigator: globalThis.navigator,
      URL: globalThis.URL,
      setTimeout: globalThis.setTimeout
    };

    const fakeWindow = {
      navigator: {},
      setTimeout: (fn: () => void, ms: number) => {
        timeouts.push(ms);
        void fn;
        return 1;
      }
    };

    Object.defineProperty(globalThis, "window", { value: fakeWindow, configurable: true });
    Object.defineProperty(globalThis, "document", { value: fakeDocument, configurable: true });
    Object.defineProperty(globalThis, "URL", {
      value: {
        createObjectURL: () => "blob:export-test",
        revokeObjectURL: () => undefined
      },
      configurable: true
    });
    Object.defineProperty(globalThis, "setTimeout", {
      value: (fn: () => void, ms: number) => {
        timeouts.push(ms);
        void fn;
        return 1;
      },
      configurable: true
    });

    try {
      downloadBlobAsFile("lumen-export-2026-09-13.json", userExportBlob({ journals: [] }));
      expect(fakeLink.href).toBe("blob:export-test");
      expect(fakeLink.download).toBe("lumen-export-2026-09-13.json");
      expect(fakeLink.type).toBe(USER_EXPORT_DOWNLOAD_TYPE);
      expect(clicks).toEqual(["click"]);
      expect(removed).toEqual([]);
      expect(timeouts[0]).toBeGreaterThanOrEqual(2_000);
    } finally {
      Object.defineProperty(globalThis, "window", { value: previous.window, configurable: true });
      Object.defineProperty(globalThis, "document", { value: previous.document, configurable: true });
      Object.defineProperty(globalThis, "navigator", { value: previous.navigator, configurable: true });
      Object.defineProperty(globalThis, "URL", { value: previous.URL, configurable: true });
      Object.defineProperty(globalThis, "setTimeout", { value: previous.setTimeout, configurable: true });
    }
  });
});
