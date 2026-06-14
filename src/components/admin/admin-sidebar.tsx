"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BookMarked,
  ListChecks,
  BarChart3,
  MessageSquareWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/lectures", label: "Lectures", icon: FileText },
  { href: "/admin/quran", label: "Quran Verses", icon: BookMarked },
  { href: "/admin/quizzes", label: "Quizzes", icon: ListChecks },
  { href: "/admin/suggestions", label: "Suggestions", icon: MessageSquareWarning },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export function AdminSidebar({ newSuggestions = 0 }: { newSuggestions?: number }) {
  const pathname = usePathname();
  return (
    <aside className="md:w-56 md:shrink-0">
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.href === "/admin/suggestions" && newSuggestions > 0 && (
                <span
                  className={cn(
                    "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                    active ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground"
                  )}
                >
                  {newSuggestions}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
