"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from("partners")
    .select(`
      id,
      partner_code,
      profiles(full_name, phone, email),
      status,
      city,
      wallet_balance,
      total_earnings,
      paid_earnings,
      created_at
    `)
    .or(`partner_code.ilike.%${query}%,profiles.phone.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("Error searching partner:", error);
    return [];
  }

  return data;
}

export async function getReferralTree(partnerId: string) {
  const supabase = getSupabaseServerClient();
  
  // Get the partner's direct referrals (level 1)
  const { data: level1, error: error1 } = await supabase
    .from("referral_tree")
    .select(`
      descendant_id,
      level,
      descendants:descendant_id (
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
  const tree: Record<number, any[]> = {};
  allLevels?.forEach((item: any) => {
    if (!tree[item.level]) {
      tree[item.level] = [];
    }
    tree[item.level].push(item.descendants);
  });

  return {
    level1: level1?.map((item: any) => item.descendants) || [],
    tree,
    totalReferrals: allLevels?.length || 0,
  };
}
