"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { AppBottomNav } from "./AppBottomNav";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";
import { PageTransition } from "@/components/motion/PageTransition";
import { ThinkingIndicator } from "@/components/motion";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";
import "@/lib/motion/gsap";

type AppShellProps = {
  children: React.ReactNode;
};

/**
 * Authenticated Lumen shell — V1 nav: Today · Journal · Chat · You.
 * Journal and Chat use full-bleed layouts (no max-width chrome).
 */
export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const initialized = useAuthStore((state) => state.initialized);
  const session = useAuthStore((state) => state.session);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isJournal = pathname.startsWith("/journal");
  const isChat = pathname.startsWith("/chat");
  const isImmersive = isJournal || isChat;

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <AppTopBar />
        <main
          className={cn(
            "flex w-full min-h-0 flex-1 flex-col",
            isImmersive
              ? "max-w-none px-0 py-0"
              : "mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8"
          )}
        >
          {isImmersive ? children : <PageTransition>{children}</PageTransition>}
        </main>
      </div>
      <AppBottomNav />
    </div>
  );
}
