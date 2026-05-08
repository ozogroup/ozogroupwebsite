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
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const pathname = req.nextUrl.pathname;

  // Admin routes protection
  if (pathname.startsWith("/admin")) {
    // Allow admin login page
    if (pathname === "/admin/login") {
      return res;
    }

    if (!session) {
      // Not authenticated - redirect to admin login
      const redirectUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    // If profile doesn't exist or role is not admin/staff/super_admin
    if (!profile || 
        !["super_admin", "admin", "staff"].includes(profile.role as any)) {
      const redirectUrl = new URL("/unauthorized", req.url);
      return NextResponse.redirect(redirectUrl);
    }
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
     * - /admin (temporarily disabled for testing)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|admin).*)",
  ],
};
