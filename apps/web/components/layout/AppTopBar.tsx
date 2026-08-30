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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/70 bg-[hsl(var(--background))]/90 px-4 backdrop-blur-md sm:px-6">
      <div className="min-w-0 md:hidden">
        <Link href="/today" className="font-display text-xl tracking-tight text-foreground">
          Lumen
        </Link>
      </div>
      <p className="hidden truncate text-sm font-medium text-foreground/70 md:block">
        {current?.label ?? "Lumen"}
      </p>

      <div className="flex items-center gap-2">
        <Link
          href="/you"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white outline-none",
            "transition-transform duration-[var(--motion-micro)] ease-[var(--ease-emphasized)] active:scale-[0.97]",
            "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
          )}
          aria-label="Open You"
        >
          {label}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="hidden h-9 items-center gap-2 rounded-lg px-2 text-sm text-foreground/65 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/35 sm:inline-flex"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </button>
      </div>
    </header>
  );
}
