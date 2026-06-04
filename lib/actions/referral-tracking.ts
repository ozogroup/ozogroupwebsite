import "server-only";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";

const COMMISSION_PERCENTAGES: Record<number, number> = {
  1: 6,
  2: 3,
  3: 1.7,
  4: 1.2,
};

export async function resolvePartnerByCode(supabase: any, referralCode?: string | null) {
  const code = normalizeKiaPartnerCode(referralCode);
  if (!code) return null;

  const { data, error } = await supabase
    .from("partners")
    .select("id, partner_code")
    .eq("partner_code", code)
    .maybeSingle();

  if (error) {
    console.error("Error resolving referral code:", error);
    return null;
  }

  return data;
}

export async function createReferralTreeForPartner(
  supabase: any,
  partnerId: string,
  sponsorId?: string | null
) {
  if (!partnerId || !sponsorId || partnerId === sponsorId) return;

  const entries = [{ ancestor_id: sponsorId, descendant_id: partnerId, level: 1, locked: true }];

  const { data: sponsorAncestors, error } = await supabase
    .from("referral_tree")
    .select("ancestor_id, level")
    .eq("descendant_id", sponsorId)
    .lte("level", 3);

  if (error) {
    console.error("Error fetching sponsor ancestors:", error);
  }

  for (const row of sponsorAncestors || []) {
    const level = Number(row.level) + 1;
    if (level <= 4 && row.ancestor_id !== partnerId) {
      entries.push({
        ancestor_id: row.ancestor_id,
        descendant_id: partnerId,
        level,
        locked: true,
      });
    }
  }

  for (const entry of entries) {
    const { data: existing, error: existingError } = await supabase
      .from("referral_tree")
      .select("id")
      .eq("ancestor_id", entry.ancestor_id)
      .eq("descendant_id", entry.descendant_id)
      .eq("level", entry.level)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking referral tree entry:", existingError);
      continue;
    }

    if (!existing) {
      const { error: insertError } = await supabase.from("referral_tree").insert(entry);
      if (insertError) {
        console.error("Error creating referral tree entry:", insertError);
      }
    }
  }
}

export async function generateBookingCommissions(
  supabase: any,
  booking: {
    id: string;
    referred_by?: string | null;
    referral_code?: string | null;
    partner_code?: string | null;
    payment_amount: number | null;
    booking_status: string;
  }
) {
  if (!["confirmed", "completed"].includes(booking.booking_status)) {
    return;
  }

  const sourceAmount = Number(booking.payment_amount ?? 0) || 0;
  if (sourceAmount <= 0) return;

  let referredBy = booking.referred_by || null;
  if (!referredBy) {
    const partner = await resolvePartnerByCode(supabase, booking.referral_code || booking.partner_code);
    referredBy = partner?.id || null;
  }

  if (!referredBy) {
    console.error("Booking commission skipped: referral partner not found", {
      bookingId: booking.id,
      referralCode: booking.referral_code,
      partnerCode: booking.partner_code,
    });
    return;
  }

  const commissionPartners = [
    { partner_id: referredBy, level: 1 },
  ];

  const { data: ancestors, error } = await supabase
    .from("referral_tree")
    .select("ancestor_id, level")
    .eq("descendant_id", referredBy)
    .lte("level", 3);

  if (error) {
    console.error("Error fetching booking commission ancestors:", error);
  }

  const ancestorRows = Array.isArray(ancestors) && ancestors.length > 0
    ? ancestors
    : await getSponsorAncestors(supabase, referredBy);

  for (const row of ancestorRows || []) {
    const level = Number(row.level) + 1;
    if (level <= 4) {
      commissionPartners.push({ partner_id: row.ancestor_id, level });
    }
  }

  for (const item of commissionPartners) {
    const percentage = COMMISSION_PERCENTAGES[item.level] || 0;
    const amount = Math.round(sourceAmount * percentage) / 100;

    const { data: existing } = await supabase
      .from("commissions")
      .select("id")
      .eq("source_type", "booking")
      .eq("source_id", booking.id)
      .eq("partner_id", item.partner_id)
      .eq("level", item.level)
      .maybeSingle();

    if (existing) continue;

    const { error: insertError } = await supabase.from("commissions").insert({
      partner_id: item.partner_id,
      source_type: "booking",
      source_id: booking.id,
      source_amount: sourceAmount,
      level: item.level,
      percentage,
      amount,
      status: "approved",
    });

    if (insertError) {
      console.error("Error creating booking commission:", insertError);
      continue;
    }

    const { data: currentPartner } = await supabase
      .from("partners")
      .select("wallet_balance, total_earnings")
      .eq("id", item.partner_id)
      .maybeSingle();

    await supabase
      .from("partners")
      .update({
        wallet_balance: (Number(currentPartner?.wallet_balance ?? 0) || 0) + amount,
        total_earnings: (Number(currentPartner?.total_earnings ?? 0) || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.partner_id);
  }
}

async function getSponsorAncestors(supabase: any, partnerId: string) {
  const ancestors: Array<{ ancestor_id: string; level: number }> = [];
  let currentPartnerId: string | null = partnerId;

  for (let level = 1; level <= 3 && currentPartnerId; level += 1) {
    const { data, error }: { data: { sponsor_id?: string | null } | null; error: any } = await supabase
      .from("partners")
      .select("sponsor_id")
      .eq("id", currentPartnerId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching sponsor hierarchy:", error);
      break;
    }

    const sponsorId: string | null = data?.sponsor_id || null;
    if (!sponsorId || sponsorId === partnerId) break;

    ancestors.push({ ancestor_id: sponsorId, level });
    currentPartnerId = sponsorId;
  }

  return ancestors;
}
