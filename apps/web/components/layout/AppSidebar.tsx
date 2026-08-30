"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

export function AppSidebar() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState({ top: 0, height: 40, ready: false });

  useLayoutEffect(() => {
    const activeIndex = PRIMARY_NAV.findIndex((item) => isNavItemActive(pathname, item));
    const el = itemRefs.current[activeIndex >= 0 ? activeIndex : 0];
    if (!el || !listRef.current) {
      return;
    }

    setIndicator({
      top: el.offsetTop,
      height: el.offsetHeight,
      ready: true
    });
  }, [pathname]);

  return (
    <aside className="hidden h-dvh w-[15.5rem] shrink-0 border-r border-border/80 bg-[hsl(var(--surface))] md:sticky md:top-0 md:flex md:flex-col">
      <div className="px-5 pb-2 pt-6">
        <Link
          href="/today"
          className="font-display text-2xl tracking-tight text-foreground outline-none transition-opacity duration-[var(--motion-micro)] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Lumen
        </Link>
        <p className="mt-1 text-xs tracking-wide text-foreground/55">Private journal companion</p>
      </div>

      <nav className="relative mt-6 flex-1 px-3" aria-label="Primary">
        <ul ref={listRef} className="relative space-y-1">
          <li
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 rounded-lg bg-primary",
              reduced
                ? "transition-none"
                : "transition-[transform,height] duration-[var(--motion-transition)] ease-[var(--ease-standard)]"
            )}
            style={{
              height: indicator.height,
              transform: `translateY(${indicator.top}px)`,
              opacity: indicator.ready ? 1 : 0
            }}
          />
          {PRIMARY_NAV.map((item, index) => {
            const active = isNavItemActive(pathname, item);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative z-10 flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors duration-[var(--motion-micro)]",
                    "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--surface))]",
                    active ? "text-white" : "text-foreground/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
