"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Brain, Home, MessageCircle } from "lucide-react";

const navItems = [
  { href: "/", label: "Today", icon: Home },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/insights", label: "Insights", icon: BarChart3 }
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-[hsl(var(--border))] bg-white md:hidden">
      {navItems.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "text-[hsl(var(--primary))]" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
