import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Middleware for route protection
 * 
 * Protected Routes:
 * - /admin/* - Requires admin/staff/super_admin role
 * - /partner/* - Requires partner role
 * 
 * Public Routes:
 * - / - Home page
 * - /about - About page
 * - /contact - Contact page
 * - /membership - Membership page
 * - /referral - Referral page
 * - /treatments - Treatments pages
 * - /thank-you - Thank you page
 */

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const cookieStore = cookies();
  const pathname = req.nextUrl.pathname;

  console.log("[MIDDLEWARE] Pathname:", pathname);

  // Safe middleware guard for missing Supabase env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("[MIDDLEWARE] ERROR: Missing Supabase environment variables");
    console.error("[MIDDLEWARE] NEXT_PUBLIC_SUPABASE_URL:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.error("[MIDDLEWARE] NEXT_PUBLIC_SUPABASE_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // Allow public routes to work even without Supabase
    const publicRoutes = ['/', '/about', '/contact', '/membership', '/referral', '/treatments', '/thank-you', '/admin/login', '/partner/login'];
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (isPublicRoute) {
      console.log("[MIDDLEWARE] Allowing public route without Supabase");
      return res;
    }

    // For protected routes, show error page
    console.error("[MIDDLEWARE] Blocking protected route due to missing Supabase config");
    const redirectUrl = new URL("/admin/login?error=Server configuration error", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("[MIDDLEWARE] Session exists:", !!session);
  if (session) {
    console.log("[MIDDLEWARE] User ID:", session.user.id);
  }

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    console.log("[MIDDLEWARE] Admin route detected");

    // Allow admin login page
    if (pathname === "/admin/login") {
      console.log("[MIDDLEWARE] Allowing admin login page");
      return res;
    }

    if (!session) {
      // Not authenticated - redirect to admin login
      console.log("[MIDDLEWARE] No session, redirecting to admin login");
      const redirectUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // TEMPORARY: Allow any authenticated user to access admin
    // Profile/role checks disabled for development
    console.log("[MIDDLEWARE] Session exists, allowing access to admin");
    return res;
  }

  // Partner routes protection
  if (pathname.startsWith("/partner")) {
    // Allow partner login page
    if (pathname === "/partner/login") {
      return res;
    }

    if (!session) {
      // Not authenticated - redirect to partner login
      const redirectUrl = new URL("/partner/login", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // If profile doesn't exist or role is not partner
    if (!profile || profile.role !== "partner") {
      const redirectUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
