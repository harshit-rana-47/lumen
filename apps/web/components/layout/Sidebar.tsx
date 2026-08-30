"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Brain, CalendarDays, Home, MessageCircle, Settings, Target } from "lucide-react";

const navItems = [
  { href: "/", label: "Today", icon: Home },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-[hsl(var(--border))] bg-white/70 px-4 py-5 md:sticky md:top-0 md:block">
      <Link href="/" className="block px-2 text-xl font-semibold tracking-normal">
        Lumen
      </Link>
      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-3 rounded px-3 text-sm ${
                active
                  ? "bg-[hsl(var(--primary))] text-white"
                  : "text-slate-700 hover:bg-[hsl(var(--muted))]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
