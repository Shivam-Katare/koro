import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { KoroWordmark } from "@/components/brand/koro-wordmark";

export function HeroNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="transition-opacity hover:opacity-90" aria-label="Koro home">
          <KoroWordmark size="md" />
        </Link>

        <nav className="hidden items-center gap-8 text-base font-medium text-muted-foreground md:flex">
          <a href="#demo" className="transition-colors hover:text-foreground">
            Demo
          </a>
          <a href="#why" className="transition-colors hover:text-foreground">
            Why Koro
          </a>
          <a href="#rush" className="transition-colors hover:text-foreground">
            Rush hour
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:text-base"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:text-base"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
