import {
  downloadBlobAsFile,
  safeExportFileName,
  USER_EXPORT_DOWNLOAD_TYPE,
  userExportBlob
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
      dispatchEvent(event: { type: string }) {
        clicks.push(event.type);
        return true;
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
      MouseEvent: globalThis.MouseEvent,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      setTimeout: globalThis.setTimeout
    };

    const fakeWindow = {
      navigator: {},
      requestAnimationFrame: (fn: () => void) => {
        fn();
        return 1;
      },
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
    Object.defineProperty(globalThis, "MouseEvent", {
      value: class {
        type: string;
        constructor(type: string) {
          this.type = type;
        }
      },
      configurable: true
    });
    Object.defineProperty(globalThis, "requestAnimationFrame", {
      value: (fn: () => void) => {
        fn();
        return 1;
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
      Object.defineProperty(globalThis, "MouseEvent", { value: previous.MouseEvent, configurable: true });
      Object.defineProperty(globalThis, "requestAnimationFrame", {
        value: previous.requestAnimationFrame,
        configurable: true
      });
      Object.defineProperty(globalThis, "setTimeout", { value: previous.setTimeout, configurable: true });
    }
  });
});
