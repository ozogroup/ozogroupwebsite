import "server-only";
import { normalizeKiaPartnerCode } from "@/lib/partner-code";
import { syncCommissionCreated } from "@/lib/integrations/google-sheet-sync";

const COMMISSION_PERCENTAGES: Record<number, number> = {
  1: 6,
  2: 3,
  3: 1.7,
  4: 1.2,
};

async function getCommissionPercentages(supabase: any): Promise<Record<number, number>> {
  try {
    const { data } = await supabase
      .from("commission_settings")
      .select("level_1_percentage, level_2_percentage, level_3_percentage, level_4_percentage")
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return COMMISSION_PERCENTAGES;
    return {
      1: Number(data.level_1_percentage) || COMMISSION_PERCENTAGES[1],
      2: Number(data.level_2_percentage) || COMMISSION_PERCENTAGES[2],
      3: Number(data.level_3_percentage) || COMMISSION_PERCENTAGES[3],
      4: Number(data.level_4_percentage) || COMMISSION_PERCENTAGES[4],
    };
  } catch {
    return COMMISSION_PERCENTAGES;
  }
}

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
    payment_status?: string | null;
  }
) {
  if (
    !["confirmed", "completed"].includes(booking.booking_status) ||
    booking.payment_status !== "paid"
  ) {
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

  const percentages = await getCommissionPercentages(supabase);

  for (const item of commissionPartners) {
    const percentage = percentages[item.level] || 0;
    const amount = Math.round(sourceAmount * percentage) / 100;

    const { data: currentPartner, error: partnerError } = await supabase
      .from("partners")
      .select("wallet_balance, total_earnings, status, membership_expires_at")
      .eq("id", item.partner_id)
      .maybeSingle();

    if (
      partnerError ||
      !currentPartner ||
      currentPartner.status !== "active" ||
      (currentPartner.membership_expires_at &&
        new Date(currentPartner.membership_expires_at).getTime() < Date.now())
    ) {
      console.error("Booking commission skipped: partner is not eligible", {
        bookingId: booking.id,
        partnerId: item.partner_id,
        level: item.level,
      });
      continue;
    }

    const { data: existing, error: existingError } = await supabase
      .from("commissions")
      .select("id")
      .eq("source_type", "booking")
      .eq("source_id", booking.id)
      .eq("partner_id", item.partner_id)
      .eq("level", item.level)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing booking commission:", existingError);
      continue;
    }
    if (existing) continue;

    // Generate the commission in a "pending" state and lock the amount.
    // Wallet is credited only when an admin approves the commission
    // (see approveCommission in lib/actions/commissions.ts). This enforces the
    // pending -> approved -> paid workflow and keeps wallet_balance equal to the
    // sum of approved-but-unpaid commissions.
    const { data: commissionData, error: insertError } = await supabase
      .from("commissions")
      .insert({
        partner_id: item.partner_id,
        source_type: "booking",
        source_id: booking.id,
        source_amount: sourceAmount,
        level: item.level,
        percentage,
        amount,
        status: "pending",
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") continue;
      console.error("Error creating booking commission:", insertError);
      continue;
    }

    if (commissionData) {
      await syncCommissionCreated({
        id: commissionData.id,
        source_id: booking.id,
        partner_id: item.partner_id,
        level: item.level,
        amount,
        status: "pending",
        created_at: commissionData.created_at,
      });
    }
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
