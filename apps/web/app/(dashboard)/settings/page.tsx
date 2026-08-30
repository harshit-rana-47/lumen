"use client";

import { FormEvent, useEffect, useState } from "react";
import { Download, Lock, Shield, Trash2, UserRound } from "lucide-react";
import { memoryCategories, useMemory, type MemoryCategory } from "@/hooks/useMemory";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type SettingsTab = "profile" | "privacy" | "security" | "data";

const tabs: Array<{ value: SettingsTab; label: string }> = [
  { value: "profile", label: "Profile" },
  { value: "privacy", label: "Privacy" },
  { value: "security", label: "Security" },
  { value: "data", label: "Data" }
];

type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { settings, updateSetting } = useMemory();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get<ApiEnvelope<ProfileResponse>>("/auth/me");
        setProfileName(response.data.data.name ?? "");
        setProfileEmail(response.data.data.email);
      } catch {
        setProfileEmail(user?.email ?? "");
      }
    }

    void loadProfile();
  }, [user?.email]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoadingAction(true);

    try {
      await api.put("/user/profile", {
        name: profileName.trim(),
        email: profileEmail.trim()
      });
      setMessage("Profile saved.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to save profile.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoadingAction(true);

    try {
      await api.put("/user/password", {
        currentPassword,
        newPassword
      });
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Password changed.");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to change password.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function exportData() {
    setMessage(null);
    setLoadingAction(true);

    try {
      const response = await api.post<ApiEnvelope<{ signedUrl: string }>>("/user/export");
      window.location.href = response.data.data.signedUrl;
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to export data.");
    } finally {
      setLoadingAction(false);
    }
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE MY ACCOUNT") {
      return;
    }

    setMessage(null);
    setLoadingAction(true);

    try {
      await api.delete("/user/account", {
        data: { confirmation: deleteText }
      });
      await signOut();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Unable to delete account.");
      setLoadingAction(false);
    }
  }

  const settingMap = new Map(settings.map((setting) => [setting.category, setting.enabled]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">{profileEmail || "Account preferences"}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="rounded border border-[hsl(var(--border))] bg-white p-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`flex h-10 w-full items-center rounded px-3 text-left text-sm ${
                activeTab === tab.value
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "text-slate-700 hover:bg-[hsl(var(--muted))]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <section className="rounded border border-[hsl(var(--border))] bg-white p-5">
          {activeTab === "profile" ? (
            <form onSubmit={saveProfile} className="max-w-xl space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold">Profile</h2>
              </div>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Name</span>
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={loadingAction}
                className="h-10 rounded bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                Save profile
              </button>
            </form>
          ) : null}

          {activeTab === "privacy" ? (
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold">Privacy</h2>
              </div>
              <div className="divide-y divide-[hsl(var(--border))] rounded border border-[hsl(var(--border))]">
                {memoryCategories.map((category) => (
                  <label key={category.value} className="flex items-center justify-between gap-4 p-4">
                    <span>
                      <span className="block text-sm font-medium">{category.label}</span>
                      <span className="block text-xs text-slate-500">Memory extraction</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={settingMap.get(category.value) ?? true}
                      onChange={(event) =>
                        void updateSetting(category.value as MemoryCategory, event.target.checked)
                      }
                      className="h-5 w-5 accent-[hsl(var(--primary))]"
                    />
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "security" ? (
            <form onSubmit={savePassword} className="max-w-xl space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[hsl(var(--primary))]" />
                <h2 className="text-base font-semibold">Security</h2>
              </div>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-medium">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="h-10 w-full rounded border border-[hsl(var(--border))] px-3 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={loadingAction || newPassword.length < 8}
                className="h-10 rounded bg-[hsl(var(--primary))] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                Change password
              </button>
            </form>
          ) : null}

          {activeTab === "data" ? (
            <div className="max-w-2xl space-y-6">
              <div>
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[hsl(var(--primary))]" />
                  <h2 className="text-base font-semibold">Data</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void exportData()}
                  disabled={loadingAction}
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded border border-[hsl(var(--border))] px-4 text-sm text-slate-700 hover:bg-[hsl(var(--muted))] disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  Export data
                </button>
              </div>

              <div className="rounded border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <Trash2 className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Delete account</h3>
                </div>
                <input
                  value={deleteText}
                  onChange={(event) => setDeleteText(event.target.value)}
                  className="mt-4 h-10 w-full rounded border border-red-200 bg-white px-3 text-sm"
                  placeholder="DELETE MY ACCOUNT"
                />
                <button
                  type="button"
                  onClick={() => void deleteAccount()}
                  disabled={loadingAction || deleteText !== "DELETE MY ACCOUNT"}
                  className="mt-3 h-10 rounded bg-red-700 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete account
                </button>
              </div>
            </div>
          ) : null}

          {message ? <p className="mt-5 text-sm text-slate-600">{message}</p> : null}
        </section>
      </div>
    </div>
  );
}
