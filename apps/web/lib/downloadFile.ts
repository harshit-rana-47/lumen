import { serializeUserExport, userExportFileName } from "./youView";

export const USER_EXPORT_DOWNLOAD_TYPE = "application/octet-stream";
export const USER_EXPORT_DOWNLOAD_PATH = "/api/user-export";
/** Clear the Export button promptly; iframe onload can still replace this with an error. */
export const USER_EXPORT_BUSY_TIMEOUT_MS = 3_000;

export function safeExportFileName(fileName: string | null | undefined, now: Date = new Date()): string {
  const trimmed = fileName?.trim() ?? "";
  if (/^lumen-export-\d{4}-\d{2}-\d{2}\.json$/.test(trimmed)) {
    return trimmed;
  }
  return userExportFileName(undefined, now);
}

export function userExportBlob(payload: unknown): Blob {
  return new Blob([serializeUserExport(payload)], { type: USER_EXPORT_DOWNLOAD_TYPE });
}

export function userExportDownloadUrl(now: number = Date.now()): string {
  return `${USER_EXPORT_DOWNLOAD_PATH}?ts=${now}`;
}

export function parseExportRouteError(bodyText: string): string | null {
  const trimmed = bodyText.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed) as { success?: unknown; error?: unknown };
    if (parsed.success === false && typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    return null;
  }
  return null;
}

type SaveBlobNavigator = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, fileName: string) => boolean;
};

export type SameOriginExportDownload = {
  frame: HTMLIFrameElement;
  link: HTMLAnchorElement;
};

/**
 * Same-origin attachment navigation. Must run inside the click handler (no await
 * beforehand) so the browser treats it as a user-initiated download.
 */
export function beginSameOriginExportDownload(
  doc: Document = document,
  onLoad?: (frame: HTMLIFrameElement) => void
): SameOriginExportDownload {
  const frameName = `lumen-export-${Date.now()}`;
  const frame = doc.createElement("iframe");
  frame.name = frameName;
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.position = "fixed";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  if (onLoad) {
    frame.addEventListener("load", () => onLoad(frame));
  }
  doc.body.appendChild(frame);

  const link = doc.createElement("a");
  link.href = userExportDownloadUrl();
  link.target = frameName;
  link.type = USER_EXPORT_DOWNLOAD_TYPE;
  link.style.display = "none";
  doc.body.appendChild(link);
  link.click();

  return { frame, link };
}

/**
 * Force a file save from an already-fetched blob. Prefer beginSameOriginExportDownload
 * on click; this remains for tests and fallbacks.
 */
export function downloadBlobAsFile(fileName: string, blob: Blob): void {
  const save = (window.navigator as SaveBlobNavigator).msSaveOrOpenBlob;
  if (typeof save === "function") {
    save(blob, fileName);
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.rel = "noopener";
  link.type = USER_EXPORT_DOWNLOAD_TYPE;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 2_000);
}

export function downloadUserExportFile(fileName: string | null | undefined, payload: unknown): void {
  downloadBlobAsFile(safeExportFileName(fileName), userExportBlob(payload));
}
