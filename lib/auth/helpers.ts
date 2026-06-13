import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = "super_admin" | "admin" | "staff" | "content_manager" | "partner" | "customer";

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (e: any) {
    console.error("[AUTH] getUser failed:", e?.message || e);
    return null;
  }
}

/**
 * Get current user's profile with role
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile;
  } catch (e: any) {
    console.error("[AUTH] getProfile failed:", e?.message || e);
    return null;
  }
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require profile - redirect if no profile exists
 */
export async function requireProfile() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/unauthorized");
  }

  return profile;
}

/**
 * Require specific role - redirect if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await requireProfile();

  if (!allowedRoles.includes(profile.role as UserRole)) {
    redirect("/unauthorized");
  }

  return profile;
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    return false;
  }

  return profile.role === role;
}

/**
 * Check if current user has any of the allowed roles
 */
export async function hasAnyRole(allowedRoles: UserRole[]): Promise<boolean> {
  const profile = await getCurrentProfile();
  
  if (!profile) {
    return false;
  }

  return allowedRoles.includes(profile.role as UserRole);
}

/**
 * Require super admin role
 */
export async function requireSuperAdmin() {
  return await requireRole(["super_admin"]);
}

/**
 * Require admin role (includes super_admin)
 */
export async function requireAdmin() {
  return await requireRole(["super_admin", "admin"]);
}

/**
 * Require staff role (includes admin, super_admin)
 */
export async function requireStaff() {
  return await requireRole(["super_admin", "admin", "staff"]);
}

/**
 * Require content manager role
 */
export async function requireContentManager() {
  return await requireRole(["content_manager"]);
}

/**
 * Require partner role
 */
export async function requirePartner() {
  return await requireRole(["partner"]);
}

/**
 * Check if current user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return await hasRole("super_admin");
}

/**
 * Check if current user is admin (includes super_admin)
 */
export async function isAdmin(): Promise<boolean> {
  return await hasAnyRole(["super_admin", "admin"]);
}

/**
 * Check if current user is staff (includes admin, super_admin)
 */
export async function isStaff(): Promise<boolean> {
  return await hasAnyRole(["super_admin", "admin", "staff"]);
}

/**
 * Check if current user is partner
 */
export async function isPartner(): Promise<boolean> {
  return await hasRole("partner");
}

/**
 * Get current user's partner data
 */
export async function getCurrentPartner() {
  const profile = await requirePartner();
  
  const supabase = await getSupabaseServerClient();
  const { data: partner, error } = await supabase
    .from("partners")
    .select("*")
    .eq("id", profile.id)
    .single();

  if (error || !partner) {
    return null;
  }

  return partner;
}

/**
 * Get current user's admin data
 */
export async function getCurrentAdmin() {
  const profile = await requireAdmin();
  
  const supabase = await getSupabaseServerClient();
  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("id", profile.id)
    .single();

  if (error || !admin) {
    return null;
  }

  return admin;
}
