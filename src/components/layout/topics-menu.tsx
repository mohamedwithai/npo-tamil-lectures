"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CATEGORIES } from "@/lib/categories";

/** Desktop mega-menu: a colour-coded grid of content categories. */
export function TopicsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          Topics <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(92vw,560px)] p-3">
        <div className="grid gap-1 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <DropdownMenuItemLink
              key={c.slug}
              href={`/topics/${c.slug}`}
              color={c.color}
              icon={<c.icon className="h-4 w-4" />}
              title={c.nameTa}
              subtitle={c.descTa}
            />
          ))}
        </div>
        <Link
          href="/topics"
          className="mt-1 block rounded-lg p-2.5 text-center text-sm font-medium text-primary hover:bg-accent"
        >
          அனைத்துப் பிரிவுகள் →
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuItemLink({
  href,
  color,
  icon,
  title,
  subtitle,
}: {
  href: string;
  color: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
        style={{ backgroundColor: color }}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-tamil text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}
