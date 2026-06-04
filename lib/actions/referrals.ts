"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function getCommissionLevels() {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("commission_settings")
    .select("*")
    .eq("active", true)
    .single();

  if (error) {
    console.error("Error fetching commission levels:", error);
    return null;
  }

  return data;
}

export async function searchPartner(query: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const term = query.trim();
  if (!term) return [];

  const partnerColumns = `
    id,
    partner_code,
    profiles(full_name, phone, email),
    status,
    city,
    wallet_balance,
    total_earnings,
    paid_earnings,
    created_at
  `;

  const { data: codeMatches, error: codeError } = await supabase
    .from("partners")
    .select(partnerColumns)
    .ilike("partner_code", `%${term}%`)
    .limit(10);

  if (codeError) {
    console.error("Error searching partner code:", codeError);
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .or(`phone.ilike.%${term}%,full_name.ilike.%${term}%`)
    .limit(10);

  if (profileError) {
    console.error("Error searching partner profiles:", profileError);
  }

  const profileIds = (profiles || []).map((profile: any) => profile.id).filter(Boolean);
  const { data: profileMatches, error: partnerError } = profileIds.length
    ? await supabase
        .from("partners")
        .select(partnerColumns)
        .in("id", profileIds)
        .limit(10)
    : { data: [], error: null };

  if (partnerError) {
    console.error("Error searching partners by profile:", partnerError);
  }

  const merged = new Map<string, any>();
  for (const partner of [...(codeMatches || []), ...(profileMatches || [])]) {
    if (partner?.id) merged.set(partner.id, partner);
  }

  return Array.from(merged.values()).slice(0, 10);
}

async function getSponsorFallbackTree(supabase: any, partnerId: string) {
  const tree: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  let currentIds = [partnerId];

  for (let level = 1; level <= 4 && currentIds.length > 0; level += 1) {
    const { data, error } = await supabase
      .from("partners")
      .select(`
        id,
        partner_code,
        sponsor_id,
        profiles(full_name, phone, email),
        status,
        city,
        wallet_balance,
        total_earnings,
        created_at
      `)
      .in("sponsor_id", currentIds);

    if (error) {
      console.error("Error fetching sponsor fallback tree:", error);
      break;
    }

    tree[level] = data || [];
    currentIds = (data || []).map((partner: any) => partner.id).filter(Boolean);
  }

  return tree;
}

async function getPendingMembers(supabase: any, sponsorId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("id, full_name, mobile, city, membership_status, payment_status, sponsor_id, created_at")
    .eq("sponsor_id", sponsorId)
    .neq("membership_status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending members:", error);
    return [];
  }

  return data;
}

export async function getReferralTree(partnerId: string) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  
  // Get the partner's direct referrals (level 1)
  const { data: level1, error: error1 } = await supabase
    .from("referral_tree")
    .select(`
      descendant_id,
      level,
      descendants:descendant_id (
        id,
        partner_code,
        profiles(full_name, phone, email),
        status,
        city,
        wallet_balance,
        total_earnings,
        created_at
      )
    `)
    .eq("ancestor_id", partnerId)
    .eq("level", 1);

  if (error1) {
    console.error("Error fetching referral tree:", error1);
    return null;
  }

  // Get all levels for the partner
  const { data: allLevels, error: error2 } = await supabase
    .from("referral_tree")
    .select(`
      level,
      descendants:descendant_id (
        id,
        partner_code,
        profiles(full_name, phone, email),
        status,
        city,
        wallet_balance,
        total_earnings,
        created_at
      )
    `)
    .eq("ancestor_id", partnerId)
    .order("level");

  if (error2) {
    console.error("Error fetching all referral levels:", error2);
    return null;
  }

  // Group by level
  let tree: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  allLevels?.forEach((item: any) => {
    if (!tree[item.level]) {
      tree[item.level] = [];
    }
    tree[item.level].push(item.descendants);
  });

  if (!allLevels || allLevels.length === 0) {
    tree = await getSponsorFallbackTree(supabase, partnerId);
  }

  const pendingMembers = await getPendingMembers(supabase, partnerId);

  return {
    level1: tree[1] || level1?.map((item: any) => item.descendants) || [],
    tree,
    pendingMembers,
    totalReferrals: Object.values(tree).reduce((sum, partners: any) => sum + partners.length, 0),
  };
}
