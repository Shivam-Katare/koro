import { redirect } from "next/navigation";
import { KoroLandingPage } from "@/components/landing/landing-sections";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  if (params?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`);
  }

  return <KoroLandingPage />;
}
