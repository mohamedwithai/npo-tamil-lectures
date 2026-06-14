import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-secondary/30">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground sm:flex-row">
        <p className="font-tamil">
          © {new Date().getFullYear()} சொற்பொழிவுகள் — அறக்கட்டளை
        </p>
        <nav className="flex gap-4">
          <Link href="/lectures" className="hover:text-foreground">
            Lectures
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
        </nav>
      </div>
    </footer>
  );
}
