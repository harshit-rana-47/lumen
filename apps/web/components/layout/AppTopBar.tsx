"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/nav";
import { cn } from "@/lib/cn";

export function AppTopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const current = PRIMARY_NAV.find((item) => isNavItemActive(pathname, item));
  const label = user?.email?.slice(0, 1).toUpperCase() ?? "U";

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md sm:px-6">
      <div className="min-w-0 md:hidden">
        <Link href="/today" className="font-display text-xl tracking-tight text-foreground">
          Lumen
        </Link>
      </div>
      <p className="hidden truncate text-sm font-medium text-ink-muted md:block">
        {current?.label ?? "Lumen"}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href="/you"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/15 text-sm font-semibold text-primary outline-none",
            "transition-transform duration-micro ease-lumen-emphasized active:scale-[0.97]",
            "focus-visible:shadow-focus"
          )}
          aria-label="Open You"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="hidden h-9 items-center gap-2 rounded-lumen px-2 text-sm text-ink-muted outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:shadow-focus sm:inline-flex"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </header>
  );
}
