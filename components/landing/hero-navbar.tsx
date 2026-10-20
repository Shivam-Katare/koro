import Link from "next/link";
import { Store, Play, Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function HeroNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                Zibbi
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Sparkles className="h-2.5 w-2.5 text-primary" />
                Retail AI
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Shop Operations Assistant
            </span>
          </div>
        </Link>

        {/* Center / Highlights */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5 text-foreground">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            No Setup Demo Available
          </span>
          <span className="border-l border-border h-4" />
          <span>Find by Voice</span>
          <span>•</span>
          <span>Slip Extraction</span>
          <span>•</span>
          <span>WhatsApp Restock</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href="/login"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-lg border border-border bg-secondary px-3.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Sign In
          </Link>

          <Link
            href="/demo"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Try Demo</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
