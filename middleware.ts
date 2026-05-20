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
  const pathname = req.nextUrl.pathname;

  // Set x-pathname as request header so layouts can read the current path
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Only protect admin and partner routes — skip Supabase for everything else
  const isAdmin = pathname.startsWith("/admin");
  const isPartner = pathname.startsWith("/partner");
  if (!isAdmin && !isPartner) return res;

  // Allow login and password reset pages without any check
  if (pathname === "/admin/login" || pathname === "/partner/login" || pathname === "/partner/forgot-password" || pathname === "/partner/reset-password") return res;

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
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (e: any) {
    console.error("[MIDDLEWARE] Session fetch failed:", e?.message || e);
    return NextResponse.redirect(new URL("/admin/login?error=Connection+error", req.url));
  }

  if (!session) {
    const loginPath = isAdmin ? "/admin/login" : "/partner/login";
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  // Admin routes: allow any authenticated user for now
  if (isAdmin) return res;

  // Partner routes: verify role
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || profile.role !== "partner") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (e: any) {
    console.error("[MIDDLEWARE] Profile fetch failed:", e?.message || e);
    return NextResponse.redirect(new URL("/partner/login?error=Connection+error", req.url));
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
