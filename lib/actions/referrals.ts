"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function getCommissionLevels() {
  const supabase = await getSupabaseServerClient();
  
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
  const normalizedCode = normalizeKiaPartnerCode(term);
  const phoneDigits = term.replace(/\D/g, "");

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
    .or(`partner_code.eq.${normalizedCode},partner_code.ilike.%${term}%,partner_code.ilike.%${normalizedCode}%`)
    .limit(10);

  if (codeError) {
    console.error("Error searching partner code:", codeError);
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .or(`phone.ilike.%${term}%,phone.ilike.%${phoneDigits || term}%,full_name.ilike.%${term}%,email.ilike.%${term.toLowerCase()}%`)
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

export async function getReferralOverview() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const partnerColumns = `
    id,
    partner_code,
    profiles(full_name, phone, email),
    sponsor_id,
    status,
    city,
    wallet_balance,
    total_earnings,
    paid_earnings,
    created_at
  `;

  const [
    commissionLevels,
    partnersCount,
    activePartnersCount,
    pendingMembersCount,
    treeLinksCount,
    recentPartners,
  ] = await Promise.all([
    getCommissionLevels(),
    supabase.from("partners").select("id", { count: "exact", head: true }),
    supabase.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .not("membership_status", "in", "(active,rejected)"),
    supabase.from("referral_tree").select("ancestor_id", { count: "exact", head: true }),
    supabase
      .from("partners")
      .select(partnerColumns)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (recentPartners.error) {
    console.error("Error fetching referral overview partners:", recentPartners.error);
  }

  return {
    commissionLevels,
    totals: {
      partners: partnersCount.count || 0,
      activePartners: activePartnersCount.count || 0,
      pendingMembers: pendingMembersCount.count || 0,
      treeLinks: treeLinksCount.count || 0,
    },
    recentPartners: recentPartners.data || [],
  };
}

// Full directory of every partner account in the business, with who referred
// them (sponsor), how many people they directly referred, and how many hops
// they sit below the top of their sponsor chain. Unlike getReferralOverview
// (which only returns 8 "recent" partners for the dashboard-style cards),
// this is meant to be the complete, browsable list an admin can search.
export async function getAllPartnersDirectory(limit = 500) {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("partners")
    .select(`
      id,
      partner_code,
      profiles(full_name, phone, email),
      sponsor_id,
      status,
      city,
      wallet_balance,
      total_earnings,
      paid_earnings,
      kyc_status,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching partner directory:", error);
    return [];
  }

  const rows = (data || []) as any[];
  const byId = new Map(rows.map((partner) => [partner.id, partner]));
  const directTeamCount = new Map<string, number>();
  for (const partner of rows) {
    if (partner.sponsor_id) {
      directTeamCount.set(partner.sponsor_id, (directTeamCount.get(partner.sponsor_id) || 0) + 1);
    }
  }

  function levelFromRoot(partnerId: string): number {
    const seen = new Set<string>();
    let level = 0;
    let currentId: string | null = partnerId;
    while (currentId && !seen.has(currentId) && level < 20) {
      seen.add(currentId);
      const current = byId.get(currentId);
      if (!current?.sponsor_id) break;
      level += 1;
      currentId = current.sponsor_id;
    }
    return level;
  }

  return rows.map((partner) => ({
    ...partner,
    sponsor: partner.sponsor_id ? byId.get(partner.sponsor_id) || null : null,
    directTeamCount: directTeamCount.get(partner.id) || 0,
    levelFromRoot: levelFromRoot(partner.id),
  }));
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

  const { data: selectedPartner, error: selectedError } = await supabase
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
    .eq("id", partnerId)
    .maybeSingle();

  if (selectedError) {
    console.error("Error fetching selected referral partner:", selectedError);
  }
  
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
  }

  // Group by level
  let tree: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [] };
  if (!error2) {
    allLevels?.forEach((item: any) => {
      if (!tree[item.level]) {
      tree[item.level] = [];
      }
      if (item.descendants) tree[item.level].push(item.descendants);
    });
  }

  if (error2 || !allLevels || allLevels.length === 0) {
    tree = await getSponsorFallbackTree(supabase, partnerId);
  }

  const pendingMembers = await getPendingMembers(supabase, partnerId);

  return {
    partner: selectedPartner,
    level1: tree[1] || level1?.map((item: any) => item.descendants) || [],
    tree,
    pendingMembers,
    totalReferrals: Object.values(tree).reduce((sum, partners: any) => sum + partners.length, 0),
  };
}
