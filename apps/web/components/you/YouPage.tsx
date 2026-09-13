"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useRef, useState, type ReactNode } from "react";
import axios from "axios";
import { Download, LogOut } from "lucide-react";
import { FadeReveal } from "@/components/motion/FadeReveal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toggle } from "@/components/ui/Toggle";
import { useJournalActivity } from "@/hooks/useJournalActivity";
import { useLocalDay } from "@/hooks/useLocalDay";
import { useMemorySettings } from "@/hooks/useMemorySettings";
import { useProfile } from "@/hooks/useProfile";
import type { MemoryCategory } from "@/hooks/useMemory";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { downloadUserExportFile } from "@/lib/downloadFile";
import {
  ACCOUNT_DELETE_CONFIRMATION,
  MEMORY_CATEGORY_COPY,
  youDisplayName,
  youJourneyLine,
  youMonogram
} from "@/lib/youView";
import { useAuthStore } from "@/stores/authStore";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

type ExportResponse = {
  payload?: unknown;
  fileName?: string;
  signedUrl?: string | null;
  fallback?: boolean;
};

function describeApiError(caught: unknown, fallback: string): string {
  if (axios.isAxiosError(caught)) {
    const body = caught.response?.data as { error?: unknown } | undefined;
    if (typeof body?.error === "string" && body.error.trim()) {
      return body.error;
    }
  }
  if (caught instanceof Error && caught.message.trim()) {
    return caught.message;
  }
  return fallback;
}

const fieldClass =
  "mt-2 h-11 w-full rounded-xl border border-border/70 bg-background/50 px-3 text-sm text-foreground outline-none placeholder:text-ink-faint focus:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25";

const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground outline-none transition-transform duration-[var(--motion-micro)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50";

const ghostButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/70 px-4 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-50";

function Section({
  overline,
  title,
  description,
  children
}: {
  overline: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated/80 p-5 sm:p-7">
      <p className="lumen-overline text-primary/85">{overline}</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function YouPage() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);
  const { today } = useLocalDay();
  const { summary, loading: activityLoading } = useJournalActivity(today);
  const { name, email, setName, setEmail } = useProfile();
  const { settings, categories, loading: settingsLoading, error: settingsError, updateSetting } =
    useMemorySettings();

  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const exportInFlight = useRef(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const displayName = youDisplayName(name, email);
  const monogram = youMonogram(name, email);
  const journey = youJourneyLine(summary, activityLoading);
  const settingMap = useMemo(
    () => new Map(settings.map((setting) => [setting.category, setting.enabled])),
    [settings]
  );

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setProfileBusy(true);
    try {
      await api.put("/user/profile", {
        ...(name.trim() ? { name: name.trim() } : {}),
        email: email.trim()
      });
      setNotice({ tone: "ok", text: "Your details are saved." });
    } catch (caught) {
      setNotice({
        tone: "error",
        text: caught instanceof Error ? caught.message : "Unable to save your details."
      });
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setPasswordBusy(true);
    try {
      await api.put("/user/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setNotice({ tone: "ok", text: "Your password is updated." });
    } catch (caught) {
      setNotice({
        tone: "error",
        text: caught instanceof Error ? caught.message : "Unable to change your password."
      });
    } finally {
      setPasswordBusy(false);
    }
  }

  async function exportData() {
    if (exportInFlight.current) {
      return;
    }
    exportInFlight.current = true;
    setNotice(null);
    setExportBusy(true);
    try {
      const response = await api.post<ApiEnvelope<ExportResponse>>("/user/export");
      const result = response.data.data;
      if (!result?.payload) {
        throw new Error("Unable to export your data.");
      }
      downloadUserExportFile(result.fileName, result.payload);
      setNotice({ tone: "ok", text: "Your data copy is downloading." });
    } catch (caught) {
      setNotice({
        tone: "error",
        text: describeApiError(caught, "Unable to export your data.")
      });
    } finally {
      exportInFlight.current = false;
      setExportBusy(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  async function deleteAccount() {
    if (deleteText !== ACCOUNT_DELETE_CONFIRMATION) {
      return;
    }
    setDeleteBusy(true);
    setNotice(null);
    try {
      await api.delete("/user/account", {
        data: { confirmation: deleteText }
      });
      await signOut();
      router.replace("/login");
    } catch (caught) {
      setNotice({
        tone: "error",
        text: caught instanceof Error ? caught.message : "Unable to delete your account."
      });
      setDeleteBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-2 sm:gap-10 sm:py-6">
      <FadeReveal duration="transition" y={10}>
        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface-elevated/80 p-5 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15 font-display text-2xl text-primary">
                {monogram}
              </div>
              <div className="min-w-0">
                <p className="lumen-overline text-primary/90">You</p>
                <h1 className="mt-1 truncate font-display text-3xl tracking-tight text-foreground sm:text-4xl">
                  {displayName}
                </h1>
                {email ? <p className="mt-1 truncate text-sm text-ink-muted">{email}</p> : null}
                <p className="mt-3 text-sm leading-relaxed text-ink-muted">{journey}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:flex-col sm:items-stretch">
              <Link href="/journal" className={ghostButtonClass}>
                Open journal
              </Link>
              <button type="button" onClick={() => void logout()} className={ghostButtonClass}>
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </div>
          </div>
        </header>
      </FadeReveal>

      {notice ? (
        <p
          className={cn("text-sm", notice.tone === "error" ? "text-danger" : "text-ink-muted")}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}

      <FadeReveal duration="transition" delay={0.06} y={10}>
        <Section
          overline="Account"
          title="Your details"
          description="The name shown in Lumen, and the email you sign in with."
        >
          <form onSubmit={(event) => void saveProfile(event)} className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={fieldClass}
                autoComplete="name"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
                autoComplete="email"
                required
              />
            </label>
            <button type="submit" disabled={profileBusy} className={primaryButtonClass}>
              Save details
            </button>
          </form>
        </Section>
      </FadeReveal>

      <FadeReveal duration="transition" delay={0.1} y={10}>
        <Section
          overline="Memory"
          title="What Lumen may remember"
          description="When you save a page, Lumen can keep lasting facts for Chat and Reflect. Turn a category off to stop new extraction there."
        >
          {settingsError && !settingsLoading ? (
            <p className="text-sm text-danger" role="alert">
              {settingsError}
            </p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/50">
              {categories.map((category) => {
                const copy = MEMORY_CATEGORY_COPY[category.value];
                const enabled = settingMap.get(category.value) ?? true;
                return (
                  <li
                    key={category.value}
                    className="flex items-center justify-between gap-4 bg-surface/40 px-4 py-3.5"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-sm font-medium text-foreground">{copy.label}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{copy.detail}</p>
                    </div>
                    <div className="ml-auto flex h-7 w-12 shrink-0 items-center justify-end">
                      <Toggle
                        checked={enabled}
                        disabled={settingsLoading}
                        label={`${copy.label}: ${enabled ? "on" : "off"}`}
                        onCheckedChange={(next) => void updateSetting(category.value as MemoryCategory, next)}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>
      </FadeReveal>

      <FadeReveal duration="transition" delay={0.14} y={10}>
        <Section
          overline="Sign-in"
          title="Password"
          description="Change the password you use to open Lumen."
        >
          <form onSubmit={(event) => void savePassword(event)} className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className={fieldClass}
                autoComplete="current-password"
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className={fieldClass}
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            <button
              type="submit"
              disabled={passwordBusy || newPassword.length < 8}
              className={primaryButtonClass}
            >
              Update password
            </button>
          </form>
        </Section>
      </FadeReveal>

      <FadeReveal duration="transition" delay={0.18} y={10}>
        <Section
          overline="Your data"
          title="Take a copy"
          description="Download a metadata copy of your journals, memories, and chats. Encrypted page bodies are not included yet."
        >
          <div className="flex flex-col items-start gap-3">
            <button type="button" onClick={() => void exportData()} disabled={exportBusy} className={ghostButtonClass}>
              <Download className="h-4 w-4" aria-hidden />
              {exportBusy ? "Preparing copy…" : "Export data"}
            </button>
            {notice ? (
              <p
                className={cn("text-sm", notice.tone === "error" ? "text-danger" : "text-ink-muted")}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.text}
              </p>
            ) : null}
          </div>
        </Section>
      </FadeReveal>

      <FadeReveal duration="transition" delay={0.22} y={10}>
        <section className="rounded-2xl border border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger-soft))] p-5 sm:p-7">
          <p className="lumen-overline text-[hsl(var(--danger))]">Leave Lumen</p>
          <h2 className="mt-2 font-display text-2xl tracking-tight text-foreground">Delete account</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            This removes your journal, pictures, chats, memories, and sign-in. It cannot be undone.
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteText("");
              setConfirmDelete(true);
            }}
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[hsl(var(--danger))] px-4 text-sm font-semibold text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Delete account
          </button>
        </section>
      </FadeReveal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        description="Type DELETE MY ACCOUNT to confirm. Your journal, chats, and memories will be removed."
        confirmLabel="Delete account"
        danger
        busy={deleteBusy}
        confirmDisabled={deleteText !== ACCOUNT_DELETE_CONFIRMATION}
        onCancel={() => {
          if (!deleteBusy) {
            setConfirmDelete(false);
          }
        }}
        onConfirm={() => void deleteAccount()}
      >
        <input
          value={deleteText}
          onChange={(event) => setDeleteText(event.target.value)}
          className={fieldClass}
          placeholder="DELETE MY ACCOUNT"
          autoComplete="off"
          aria-label="Type DELETE MY ACCOUNT to confirm"
        />
      </ConfirmDialog>
    </div>
  );
}
