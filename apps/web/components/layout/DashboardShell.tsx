"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { ThinkingIndicator } from "@/components/motion";
import { useAuthStore } from "@/stores/authStore";
import "@/lib/motion/gsap";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (initialized && !session) {
      router.replace("/login");
    }
  }, [initialized, router, session]);

  if (!initialized) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <ThinkingIndicator label="Preparing Lumen" />
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
