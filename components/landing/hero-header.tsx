import Link from "next/link";
import { Play, ArrowRight, ShieldCheck, Sparkles, Mic, FileText, CheckCircle2 } from "lucide-react";

export function HeroHeader() {
  return (
    <div className="flex flex-col justify-center space-y-6">
      {/* Top Badge */}
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted/80 px-3.5 py-1 text-xs font-semibold text-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Operations Assistant for Local Shops</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">No POS change required</span>
      </div>

      {/* Main Heading */}
      <div className="space-y-3">
        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.12]">
          Find products.{" "}
          <span className="text-primary block sm:inline">
            Know what&apos;s left.
          </span>{" "}
          Restock with confidence.
        </h1>
        <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          The mobile-first assistant for neighborhood shopkeepers. Speak in
          Hindi, Hinglish or English to find exact shelf locations, capture stock
          changes from handwritten bills, and prepare daily restock lists for
          WhatsApp.
        </p>
      </div>

      {/* Primary Action Buttons (2 Paths from Brief) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
        <Link
          href="/demo"
          className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Try Interactive Demo</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <span>Sign In / Create Shop</span>
        </Link>
      </div>

      {/* Frictionless Demo Subtext */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex h-2 w-2 rounded-full bg-success" />
        <span className="font-medium text-foreground">Instant Demo Mode:</span>
        <span>Pre-loaded with Pooja Store (Cosmetics &amp; Bangles, 41 items). No login needed.</span>
      </div>

      {/* Feature Guarantee Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/80 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Voice in Hindi/English</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Handwritten Slip OCR</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
          <span>Never guesses stock</span>
        </div>
      </div>
    </div>
  );
}
