"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { PageTransition } from "@/components/motion/PageTransition";
import { ThinkingIndicator } from "@/components/motion";
import { useAuthStore } from "@/stores/authStore";
import "@/lib/motion/gsap";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Authenticated Lumen shell — V1 nav: Today · Journal · Chat · You.
 */
export function AppShell({ children }: AppShellProps) {
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
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <ThinkingIndicator label="Preparing Lumen" />
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-dvh bg-background md:flex">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <AppTopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
