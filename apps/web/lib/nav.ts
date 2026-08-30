/**
 * V1 primary navigation — single source of truth for the authenticated shell.
 * Deferred destinations (memory, insights, timeline, goals) stay off primary nav.
 */

import type { LucideIcon } from "lucide-react";
import { BookOpen, MessageCircle, SunMedium, UserRound } from "lucide-react";

export type PrimaryNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match nested routes under this prefix (except for exact-only items). */
  match: "exact" | "prefix";
};

export const PRIMARY_NAV: PrimaryNavItem[] = [
  { href: "/today", label: "Today", icon: SunMedium, match: "exact" },
  { href: "/journal", label: "Journal", icon: BookOpen, match: "prefix" },
  { href: "/chat", label: "Chat", icon: MessageCircle, match: "prefix" },
  { href: "/you", label: "You", icon: UserRound, match: "prefix" }
];

export const APP_HOME = "/today";

export function isNavItemActive(pathname: string, item: PrimaryNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function activeNavIndex(pathname: string): number {
  const index = PRIMARY_NAV.findIndex((item) => isNavItemActive(pathname, item));
  return index >= 0 ? index : 0;
}
