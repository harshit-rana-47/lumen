import { serializeUserExport, userExportFileName } from "./youView";

export const USER_EXPORT_DOWNLOAD_TYPE = "application/octet-stream";

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

type SaveBlobNavigator = Navigator & {
  msSaveOrOpenBlob?: (blob: Blob, fileName: string) => boolean;
};

/**
 * Force a file save. `application/json` blobs are often previewed (and then
 * cancelled when the temporary <a> is removed). Octet-stream + a delayed
 * unlink matches how browsers treat real attachments.
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

  const click = () => {
    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window
      })
    );
  };

  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(click);
  } else {
    click();
  }

  window.setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(objectUrl);
  }, 2_000);
}

export function downloadUserExportFile(fileName: string | null | undefined, payload: unknown): void {
  downloadBlobAsFile(safeExportFileName(fileName), userExportBlob(payload));
}
