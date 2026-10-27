import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        <WifiOff className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold font-heading text-foreground mb-2">You are offline</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Please check your internet connection to continue syncing with Koro.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}
