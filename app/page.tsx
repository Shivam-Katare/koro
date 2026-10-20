import { redirect } from "next/navigation";
import { HeroNavbar } from "@/components/landing/hero-navbar";
import { HeroHeader } from "@/components/landing/hero-header";
import { HeroShowcase } from "@/components/landing/hero-showcase";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  if (params?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Top Header / Navigation within Hero */}
      <HeroNavbar />

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center relative overflow-hidden py-8 sm:py-12 lg:py-16">
        {/* Ambient background glow using theme tokens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/10 blur-3xl opacity-50"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Hero Header & Primary CTAs */}
            <div className="lg:col-span-7">
              <HeroHeader />
            </div>

            {/* Right Column: Interactive 3-Job Showcase Card */}
            <div className="lg:col-span-5">
              <HeroShowcase />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
