import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { resolveExportApiBaseUrl } from "@/lib/exportApiBase";
import { safeExportFileName, serializeUserExport } from "@/lib/youView";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Hobby plan rejects values above 10s and fails the Vercel deployment. */
export const maxDuration = 10;

const ACCESS_COOKIE = "lumen-access-token";
const EXPORT_TIMEOUT_MS = 8_000;

type ExportEnvelope = {
  success?: boolean;
  error?: string;
  data?: {
    payload?: unknown;
    fileName?: string;
  };
};

export async function GET() {
  const token = decodeURIComponent((await cookies()).get(ACCESS_COOKIE)?.value ?? "").trim();
  if (!token || token === "dev-preview") {
    return NextResponse.json({ success: false, error: "You are not signed in." }, { status: 401 });
  }

  const apiBase = resolveExportApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  if (!apiBase) {
    return NextResponse.json({ success: false, error: "Unable to export your data." }, { status: 500 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBase}/user/export`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store",
      signal: controller.signal
    });

    const body = (await response.json()) as ExportEnvelope;
    if (!response.ok || !body?.data?.payload) {
      return NextResponse.json(
        { success: false, error: body?.error ?? "Unable to export your data." },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

    const fileName = safeExportFileName(body.data.fileName);
    const contents = serializeUserExport(body.data.payload);
    return new NextResponse(contents, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to export your data. Please try again." },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
