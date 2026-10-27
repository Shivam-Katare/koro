import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Detect Demo Mode from query parameter, persistent cookie, or /demo route
  const isDemoRoute = pathname === "/demo";
  const hasDemoParam = url.searchParams.get("demo") === "true";
  const hasDemoCookie = request.cookies.get("koro_demo_mode")?.value === "true";
  const isDemoMode = isDemoRoute || hasDemoParam || hasDemoCookie;

  // 2. Direct /demo route -> set cookie and redirect straight to /dashboard
  if (isDemoRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("demo");
    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set("koro_demo_mode", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
    return response;
  }

  // 3. If user is on /login or /signup with demo=true or next=/dashboard, redirect immediately to /dashboard
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  if (isAuthRoute) {
    const nextParam = url.searchParams.get("next");
    if (hasDemoParam || (hasDemoCookie && (nextParam === "/dashboard" || !nextParam)) || nextParam === "/dashboard") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.searchParams.delete("demo");
      dashboardUrl.searchParams.delete("next");
      const response = NextResponse.redirect(dashboardUrl);
      response.cookies.set("koro_demo_mode", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      return response;
    }
  }

  // 4. Fast path for unauthenticated /dashboard requests:
  // If user visits /dashboard and has no Supabase auth token cookies, immediately grant demo shop access
  const allCookies = request.cookies.getAll();
  const hasAuthTokenCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("-auth-token")
  );

  if (pathname.startsWith("/dashboard") && !hasAuthTokenCookie) {
    supabaseResponse.cookies.set("koro_demo_mode", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database, "zibbi">(
    supabaseUrl,
    supabaseAnonKey,
    {
      db: {
        schema: "zibbi",
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // If Supabase OAuth redirects to /?code=..., forward to /auth/callback
  if (url.searchParams.has("code") && pathname !== "/auth/callback") {
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Refresh user session securely with getUser ONLY if auth token cookie is present
  let user = null;
  if (hasAuthTokenCookie) {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/inventory") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/onboarding");

  // 5. Protected Routes:
  // Unauthenticated users are allowed to access protected shop routes in Demo Mode or when visiting dashboard
  if (!user && isProtectedRoute) {
    if (isDemoMode || !pathname.startsWith("/onboarding")) {
      supabaseResponse.cookies.set("koro_demo_mode", "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
      return supabaseResponse;
    }

    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Logged in users visiting login/signup are redirected to their dashboard
  if (user && isAuthRoute) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isDemoMode && !hasDemoCookie) {
    supabaseResponse.cookies.set("koro_demo_mode", "true", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
  }

  return supabaseResponse;
}
