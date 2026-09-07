"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV, isNavItemActive } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/motion/usePrefersReducedMotion";

export function AppBottomNav() {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useLayoutEffect(() => {
    const activeIndex = PRIMARY_NAV.findIndex((item) => isNavItemActive(pathname, item));
    const el = itemRefs.current[activeIndex >= 0 ? activeIndex : 0];
    if (!el) {
      return;
    }

    setIndicator({
      left: el.offsetLeft,
      width: el.offsetWidth,
      ready: true
    });
  }, [pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <div className="relative mx-auto grid h-[4.25rem] max-w-lg grid-cols-4 px-1">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-2 h-11 rounded-lumen bg-primary/12",
            reduced
              ? "transition-none"
              : "transition-[transform,width] duration-transition ease-lumen"
          )}
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
            opacity: indicator.ready ? 1 : 0
          }}
        />
        {PRIMARY_NAV.map((item, index) => {
          const active = isNavItemActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative z-10 flex min-h-[44px] flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none",
                "focus-visible:shadow-focus",
                active ? "text-primary" : "text-ink-faint"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
