"use client";

import * as React from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, X, LogIn, LogOut, LayoutDashboard, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SearchBar } from "@/components/layout/search-bar";
import { TopicsMenu } from "@/components/layout/topics-menu";
import { CATEGORIES } from "@/lib/categories";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-tamil text-xl tracking-tight">Sirat</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lectures">Lectures</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/articles">Articles</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/library">Library</Link>
          </Button>
          <TopicsMenu />
        </nav>

        <div className="ml-auto hidden flex-1 justify-end md:flex md:max-w-xs">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          {status === "loading" ? null : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  {user.name?.split(" ")[0] ?? "Account"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "ADMIN" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={() => signIn("google")}>
              <LogIn className="h-4 w-4" /> Sign in
            </Button>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background md:hidden">
          <div className="container space-y-3 py-4">
            <SearchBar onNavigate={() => setOpen(false)} />
            <Link
              href="/lectures"
              className="block rounded-md px-2 py-2 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Lectures
            </Link>
            <Link
              href="/articles"
              className="block rounded-md px-2 py-2 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Articles
            </Link>
            <Link
              href="/library"
              className="block rounded-md px-2 py-2 hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              Library
            </Link>

            <div className="pt-1">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Topics
              </p>
              <div className="grid grid-cols-2 gap-1">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/topics/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-accent"
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      <c.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="truncate font-tamil text-sm">{c.nameTa}</span>
                  </Link>
                ))}
              </div>
            </div>

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="block rounded-md px-2 py-2 hover:bg-accent"
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
            )}
            {user ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <Button className="w-full" onClick={() => signIn("google")}>
                <LogIn className="h-4 w-4" /> Sign in with Google
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
