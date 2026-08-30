"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  const label = user?.email?.slice(0, 1).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-4 backdrop-blur">
      <details className="relative">
        <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-[hsl(var(--primary))] text-sm font-semibold text-white">
          {label}
        </summary>
        <div className="absolute right-0 mt-2 w-64 rounded border border-[hsl(var(--border))] bg-white p-2 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[hsl(var(--border))] px-2 py-2 text-sm">
            <UserRound className="h-4 w-4 text-slate-500" />
            <span className="truncate">{user?.email ?? "Signed in"}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-700 hover:bg-[hsl(var(--muted))]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </details>
    </header>
  );
}
