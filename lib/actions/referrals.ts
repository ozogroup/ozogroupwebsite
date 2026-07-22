"use server";

import { requireAdmin } from "@/lib/auth/helpers";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

// Supabase returns a to-one relationship (e.g. partners.profiles) as either
// a single object or a single-item array depending on how the FK is
// inferred for a given query shape. Normalize every row so
// partner.profiles.full_name is always safe to read.
function normalizeProfile<T extends { profiles?: any }>(row: T | null | undefined): T | null {
  if (!row) return null;
  if (Array.isArray(row.profiles)) row.profiles = row.profiles[0] || null;
  return row;
}

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
  (recentPartners.data || []).forEach((partner: any) => normalizeProfile(partner));

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
      panel_password,
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
  // Supabase can return a to-one relationship as an object or a single-item
  // array depending on how the FK is inferred — normalize it here so every
  // consumer of this directory can safely read partner.profiles.full_name.
  for (const partner of rows) {
    if (Array.isArray(partner.profiles)) partner.profiles = partner.profiles[0] || null;
  }
  const byId = new Map(rows.map((partner) => [partner.id, partner]));
  const childrenOf = new Map<string, string[]>();
  const directTeamCount = new Map<string, number>();
  for (const partner of rows) {
    if (partner.sponsor_id) {
      directTeamCount.set(partner.sponsor_id, (directTeamCount.get(partner.sponsor_id) || 0) + 1);
      if (!childrenOf.has(partner.sponsor_id)) childrenOf.set(partner.sponsor_id, []);
      childrenOf.get(partner.sponsor_id)!.push(partner.id);
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

  // Full downline size (every level, not just direct referrals) — this is
  // what "team size" means for sorting the directory, so a partner with a
  // large multi-level team surfaces above one with only a couple of direct
  // referrals but no depth.
  function totalTeamCount(partnerId: string): number {
    const seen = new Set<string>([partnerId]);
    const queue = [...(childrenOf.get(partnerId) || [])];
    let count = 0;
    while (queue.length > 0) {
      const nextId = queue.shift()!;
      if (seen.has(nextId)) continue;
      seen.add(nextId);
      count += 1;
      for (const childId of childrenOf.get(nextId) || []) queue.push(childId);
    }
    return count;
  }

  function teamCountByLevel(partnerId: string): { l1: number; l2: number; l3: number; l4: number } {
    const counts = { l1: 0, l2: 0, l3: 0, l4: 0 };
    let currentLevel = [partnerId];
    for (let depth = 1; depth <= 4 && currentLevel.length > 0; depth++) {
      const nextLevel: string[] = [];
      for (const id of currentLevel) {
        for (const childId of childrenOf.get(id) || []) nextLevel.push(childId);
      }
      if (depth === 1) counts.l1 = nextLevel.length;
      else if (depth === 2) counts.l2 = nextLevel.length;
      else if (depth === 3) counts.l3 = nextLevel.length;
      else if (depth === 4) counts.l4 = nextLevel.length;
      currentLevel = nextLevel;
    }
    return counts;
  }

  const enriched = rows.map((partner) => {
    const levels = teamCountByLevel(partner.id);
    return {
      ...partner,
      sponsor: partner.sponsor_id ? byId.get(partner.sponsor_id) || null : null,
      directTeamCount: directTeamCount.get(partner.id) || 0,
      totalTeamCount: totalTeamCount(partner.id),
      levelFromRoot: levelFromRoot(partner.id),
      l1Count: levels.l1,
      l2Count: levels.l2,
      l3Count: levels.l3,
      l4Count: levels.l4,
    };
  });

  // Whoever has the biggest team (full downline) shows first.
  return enriched.sort((a, b) => b.totalTeamCount - a.totalTeamCount || b.directTeamCount - a.directTeamCount);
}

// Financial summary for the referral network landing page — aggregates
// commissions, payouts, and partner counts by level in a single call.
export async function getReferralNetworkSummary() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();

  const [
    { data: commissions },
    { data: payouts },
    { data: partners },
    { data: treeRows },
  ] = await Promise.all([
    supabase
      .from("commissions")
      .select("partner_id, source_type, amount, status, level, reversed, deleted_at")
      .is("deleted_at", null),
    supabase
      .from("payouts")
      .select("partner_id, amount, gross_amount, status"),
    supabase
      .from("partners")
      .select("id, status, wallet_balance, kyc_status"),
    supabase
      .from("referral_tree")
      .select("ancestor_id, descendant_id, level"),
  ]);

  const commissionRows = (commissions || []) as any[];
  const payoutRows = (payouts || []) as any[];
  const partnerRows = (partners || []) as any[];

  const activeCommissions = commissionRows.filter(
    (c) => !c.reversed && ["pending", "approved", "paid"].includes(c.status)
  );
  const membershipRewards = activeCommissions.filter((c) => c.source_type === "membership");
  const bookingCommissions = activeCommissions.filter((c) => c.source_type === "booking");

  const sum = (rows: any[]) => rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  const totalMembershipRewardLiability = sum(membershipRewards.filter((c) => ["pending", "approved"].includes(c.status)));
  const totalBookingCommissionLiability = sum(bookingCommissions.filter((c) => ["pending", "approved"].includes(c.status)));
  const totalWalletLiability = partnerRows.reduce((s, p) => s + Number(p.wallet_balance || 0), 0);
  const pendingPayoutLiability = payoutRows
    .filter((p) => ["requested", "processing"].includes(p.status))
    .reduce((s, p) => s + Number(p.gross_amount || p.amount || 0), 0);
  const paidPayouts = payoutRows
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  // Per-partner earnings for the directory table
  const earningsByPartner = new Map<string, { membershipRewards: number; bookingCommissions: number; reservedPayout: number; paidPayout: number }>();
  for (const c of activeCommissions) {
    const entry = earningsByPartner.get(c.partner_id) || { membershipRewards: 0, bookingCommissions: 0, reservedPayout: 0, paidPayout: 0 };
    if (c.source_type === "membership") entry.membershipRewards += Number(c.amount || 0);
    else entry.bookingCommissions += Number(c.amount || 0);
    earningsByPartner.set(c.partner_id, entry);
  }
  for (const p of payoutRows) {
    const entry = earningsByPartner.get(p.partner_id) || { membershipRewards: 0, bookingCommissions: 0, reservedPayout: 0, paidPayout: 0 };
    if (["requested", "processing"].includes(p.status)) entry.reservedPayout += Number(p.amount || 0);
    if (p.status === "paid") entry.paidPayout += Number(p.amount || 0);
    earningsByPartner.set(p.partner_id, entry);
  }

  // Level counts from referral_tree
  const levelCounts = { 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>;
  const descendantsByLevel = new Set<string>();
  for (const row of (treeRows || []) as any[]) {
    const level = Number(row.level);
    if (level >= 1 && level <= 4) {
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    }
  }

  const pendingPartners = partnerRows.filter((p) => p.status === "pending").length;

  return {
    membershipRewardsGenerated: membershipRewards.length,
    totalMembershipRewardLiability: Math.round(totalMembershipRewardLiability * 100) / 100,
    bookingCommissionsGenerated: bookingCommissions.length,
    totalBookingCommissionLiability: Math.round(totalBookingCommissionLiability * 100) / 100,
    totalWalletLiability: Math.round(totalWalletLiability * 100) / 100,
    pendingPayoutLiability: Math.round(pendingPayoutLiability * 100) / 100,
    paidPayouts: Math.round(paidPayouts * 100) / 100,
    pendingPartners,
    levelCounts,
    earningsByPartner: Object.fromEntries(earningsByPartner),
  };
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

    tree[level] = (data || []).map((partner: any) => normalizeProfile(partner));
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
  normalizeProfile(selectedPartner as any);

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
      if (item.descendants) tree[item.level].push(normalizeProfile(item.descendants));
    });
  }

  if (error2 || !allLevels || allLevels.length === 0) {
    tree = await getSponsorFallbackTree(supabase, partnerId);
  }

  const pendingMembers = await getPendingMembers(supabase, partnerId);

  return {
    partner: selectedPartner,
    level1: tree[1] || level1?.map((item: any) => normalizeProfile(item.descendants)) || [],
    tree,
    pendingMembers,
    totalReferrals: Object.values(tree).reduce((sum, partners: any) => sum + partners.length, 0),
  };
}
