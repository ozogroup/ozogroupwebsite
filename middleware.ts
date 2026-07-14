import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ADMIN_OWNER_EMAIL = "supportkiaskincare@gmail.com";

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || "";
}

function isAdminAuthorized(role?: string | null, email?: string | null) {
  return role === "admin" || role === "super_admin" || normalizeEmail(email) === ADMIN_OWNER_EMAIL;
}

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
  const hostname = req.nextUrl.hostname.toLowerCase();
  const officialUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.kiaskincare.com").replace(/\/$/, "");
  const officialHost = new URL(officialUrl).hostname.toLowerCase();
  const legacyHosts = (process.env.LEGACY_DOMAINS || "ozo-group.vercel.app,ozogroupwebsite.vercel.app")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  const apexOfficialHost = officialHost.replace(/^www\./, "");
  const alternateOfficialHost = officialHost.startsWith("www.") ? apexOfficialHost : `www.${officialHost}`;
  if (
    process.env.NODE_ENV === "production" &&
    hostname !== officialHost &&
    (hostname.endsWith(".vercel.app") || legacyHosts.includes(hostname) || hostname === alternateOfficialHost)
  ) {
    return NextResponse.redirect(new URL(`${pathname}${req.nextUrl.search}`, officialUrl), 301);
  }

  // Set x-pathname as request header so layouts can read the current path
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  if (hostname !== officialHost && process.env.NODE_ENV === "production") {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  const referralCode = req.nextUrl.searchParams.get("ref");
  const pathReferralCode = pathname.match(/^\/((?:KIA|OZO)\d+)$/i)?.[1];
  if (pathReferralCode) {
    const normalizedPathReferralCode = pathReferralCode.trim().toUpperCase().replace(/^OZO(?=\d+$)/, "KIA");
    const redirectUrl = new URL("/membership", req.url);
    redirectUrl.searchParams.set("ref", normalizedPathReferralCode);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.cookies.set("kia_referral_code", normalizedPathReferralCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return redirectResponse;
  }

  if (referralCode) {
    const normalizedReferralCode = referralCode.trim().toUpperCase().replace(/^OZO(?=\d+$)/, "KIA");
    res.cookies.set("kia_referral_code", normalizedReferralCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  // Only protect admin and partner routes — skip Supabase for everything else
  const isAdmin = pathname.startsWith("/admin");
  const isPartner = pathname.startsWith("/partner");
  if (!isAdmin && !isPartner) return res;

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const publicAdminRoutes = new Set([
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/auth/callback",
  ]);
  const publicPartnerRoutes = new Set([
    "/partner/login",
    "/partner/forgot-password",
    "/partner/reset-password",
  ]);

  const cookieStore = await cookies();
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

  if (isAdmin && publicAdminRoutes.has(pathname)) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return res;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (isAdminAuthorized(profile?.role, user.email)) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    } catch (e: any) {
      console.error("[MIDDLEWARE] Public admin session check failed:", e?.message || e);
    }

    return res;
  }

  if (isPartner && publicPartnerRoutes.has(pathname)) return res;

  // Get trusted current user
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[MIDDLEWARE] User fetch failed:", error.message);
    }
    user = data.user;
  } catch (e: any) {
    console.error("[MIDDLEWARE] User fetch failed:", e?.message || e);
    const loginPath = isAdmin ? "/admin/login" : "/partner/login";
    return NextResponse.redirect(new URL(`${loginPath}?error=Connection+error`, req.url));
  }

  if (!user) {
    const loginPath = isAdmin ? "/admin/login" : "/partner/login";
    return NextResponse.redirect(new URL(loginPath, req.url));
  }

  // Verify role for protected admin and partner routes.
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const allowed = isAdmin
      ? isAdminAuthorized(profile?.role, user.email)
      : profile?.role === "partner";
    if (!allowed) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (e: any) {
    console.error("[MIDDLEWARE] Profile fetch failed:", e?.message || e);
    const loginPath = isAdmin ? "/admin/login" : "/partner/login";
    return NextResponse.redirect(new URL(`${loginPath}?error=Connection+error`, req.url));
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
